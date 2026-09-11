// Este archivo maneja su propio BrowserContext (ver beforeAll) para
// compartir sesión entre tests seriales, así que importa directo de
// @playwright/test en vez de ./fixtures (cuyo fixture `context` no aplica
// acá — el init script de cookies se agrega a mano más abajo).
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// Serial Y con la MISMA página entre tests — cada uno depende de la
// sesión (login) y el estado (curso comprado) que dejó el anterior. El
// fixture `page` normal de Playwright crea una página nueva por test
// incluso dentro de un describe.serial (serial solo fija el orden, no
// comparte contexto) — sin esto, el test de "comprar" arrancaba
// deslogueado y rebotaba a /auth/login.
test.describe.configure({ mode: 'serial' });

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('cookie_consent', 'accepted');
    } catch {
      // localStorage inaccesible — igual que CookieConsent, no hay nada
      // que precargar en ese caso.
    }
  });
  page = await context.newPage();
});

test.afterAll(async () => {
  await context.close();
});

function emailUnico() {
  return `e2e-checkout-${Date.now()}@suenosdev-e2e.test`;
}

const EMAIL = emailUnico();
const PASSWORD = 'Test1234!';
const API_URL = process.env.E2E_API_URL || 'http://127.0.0.1:3001/api';
let cursoId: string | null = null;
let cursoNombre = '';
let paymentIntentId = '';

async function llenarTarjetaDePrueba(page: Page) {
  // Stripe PaymentElement puede mostrar más de un método de pago (tarjeta
  // + banco/ACH) según el monto/moneda de la orden — cuando eso pasa,
  // arranca colapsado, sin ningún campo de tarjeta montado, hasta
  // seleccionar la pestaña "Tarjeta" dentro del iframe "accessory
  // target". Cuando tarjeta es el único método, ese paso no existe y los
  // campos ya están montados. En vez de asumir cuál de los dos casos es,
  // probamos el click (best-effort, con timeout corto) y después
  // buscamos los inputs donde sea que hayan quedado — por `name`
  // (number/expiry/cvc), no por placeholder, porque ese viene localizado
  // ("1234 1234..." / "MM / AA" en es) y cambiaría con el idioma.
  // [data-value="card"] es el atributo real del acordeón de Stripe — a
  // diferencia del texto de la pestaña ("Tarjeta"/"Card"/…), no depende
  // del locale que Stripe le termine asignando al Payment Element (se
  // infiere del navegador y varió entre corridas de esta misma suite).
  const tabTarjeta = page.frameLocator('iframe[src*="accessory-target"]').locator('[data-value="card"]');
  await tabTarjeta.click({ timeout: 5_000 }).catch(() => {});

  // No asumimos en qué frame terminaron montados los campos — se busca
  // el que realmente los tiene, reintentando hasta que Stripe los monte.
  const buscarFrameConTarjeta = async () => {
    for (const frame of page.frames()) {
      if (await frame.locator('input[name="number"]').count().catch(() => 0)) return frame;
    }
    return null;
  };
  await expect
    .poll(async () => (await buscarFrameConTarjeta()) !== null, { timeout: 15_000, message: 'esperando el campo de número de tarjeta' })
    .toBe(true);
  const frame = await buscarFrameConTarjeta();
  if (!frame) throw new Error('No se encontró el campo de número de tarjeta en ningún frame');

  await frame.locator('input[name="number"]').fill('4242424242424242');
  await frame.locator('input[name="expiry"]').fill('12/34');
  await frame.locator('input[name="cvc"]').fill('123');
}

test.describe('Compra de un curso con Stripe (tarjeta de prueba)', () => {
  test('registro + login', async () => {
    await page.goto('/auth/registro');
    await page.getByPlaceholder('Tu nombre').fill('E2E Checkout');
    await page.getByPlaceholder('tu@email.com').fill(EMAIL);
    await page.getByPlaceholder('••••••••').first().fill(PASSWORD);
    await page.getByPlaceholder('••••••••').nth(1).fill(PASSWORD);
    await page.getByRole('button', { name: 'Registrarse' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);

    await page.getByPlaceholder('tu@email.com').fill(EMAIL);
    await page.getByPlaceholder('••••••••').fill(PASSWORD);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('comprar el curso más barato del catálogo', async () => {
    // El PaymentElement de Stripe (varios iframes anidados, ver
    // llenarTarjetaDePrueba) puede tardar más que el timeout default de
    // 30s en terminar de montarse la primera vez.
    test.setTimeout(60_000);
    await page.goto('/cursos');
    const primerCurso = page.locator('a[href^="/cursos/"]').first();
    await primerCurso.click();
    await expect(page).toHaveURL(/\/cursos\/[^/]+$/);

    cursoNombre = (await page.locator('h1').first().innerText()).trim();

    await page.getByRole('link', { name: 'Comprar ahora' }).click();
    await expect(page).toHaveURL(/\/checkout\?cursoId=/);
    // El id del curso viaja en la URL del checkout — lo guardamos para el
    // test de "acceso al contenido" de más abajo.
    cursoId = new URL(page.url()).searchParams.get('cursoId');
    expect(cursoId).toBeTruthy();

    // POST /ordenes devuelve el clientSecret del PaymentIntent
    // ("pi_XXX_secret_YYY") — lo necesitamos para simular el webhook de
    // Stripe más abajo, así que lo capturamos de la respuesta real en vez
    // de adivinarlo.
    const [ordenResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/ordenes') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Continuar al pago' }).click(),
    ]);
    const { clientSecret } = await ordenResponse.json();
    paymentIntentId = String(clientSecret).split('_secret_')[0];

    await expect(page.getByRole('button', { name: 'Pagar ahora' })).toBeVisible({ timeout: 15_000 });

    await llenarTarjetaDePrueba(page);
    await page.getByRole('button', { name: 'Pagar ahora' }).click();

    // successUrl es /dashboard (ver CheckoutForm#irAPagar) — Stripe
    // redirige ahí después de confirmar el PaymentIntent.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

    // El PaymentIntent ya está confirmado en Stripe, pero la orden sigue
    // "pendiente" hasta que el webhook payment_intent.succeeded llega y
    // OtorgarAccesoHandler crea la inscripción — en un entorno local sin
    // `stripe listen` corriendo, ese webhook nunca llega solo. Con
    // STRIPE_WEBHOOK_SECRET=whsec_test_secret (el placeholder de
    // .env.example, no una key real todavía configurada) el controller
    // deliberadamente NO verifica firma (ver StripeWebhookController) —
    // así que se puede simular el evento posteando directo, sin tener que
    // levantar el CLI de Stripe para que la suite sea autocontenida.
    const webhook = await page.request.post(`${API_URL}/stripe/webhook`, {
      headers: { 'stripe-signature': 'e2e-test', 'Content-Type': 'application/json' },
      data: { type: 'payment_intent.succeeded', data: { object: { id: paymentIntentId } } },
    });
    expect(webhook.ok()).toBeTruthy();
  });

  test('el curso comprado aparece en "Mis Cursos" y da acceso a /aprender', async () => {
    test.skip(!cursoId, 'El test de compra anterior no llegó a completarse');

    await page.goto('/dashboard');
    await expect(page.getByText(cursoNombre)).toBeVisible({ timeout: 10_000 });

    await page.goto(`/aprender/${cursoId}`);
    // No debe caer en el estado "Curso no encontrado" ni pedir login de
    // nuevo — si el checkout no otorgó la inscripción, esto es lo que
    // fallaría primero.
    await expect(page.getByText('Curso no encontrado')).not.toBeVisible();
    await expect(page.getByText('Módulos')).toBeVisible({ timeout: 10_000 });
  });

  test('la página de certificados carga sin errores', async () => {
    await page.goto('/certificados');
    await expect(page.getByRole('heading', { name: 'Mis Certificados' })).toBeVisible();
  });
});
