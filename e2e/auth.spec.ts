import { test, expect } from './fixtures';

// Sonner (la librería de toasts) monta el mensaje visible y un anuncio
// paralelo para lectores de pantalla con el mismo texto — por eso
// getByText de un texto de toast siempre resuelve a 2 elementos.
function toast(page: import('@playwright/test').Page, texto: RegExp) {
  return page.getByText(texto).first();
}

// Un email único por corrida — evita choques entre corridas y con el
// "409 email ya registrado" del backend en un segundo intento.
function emailUnico() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@suenosdev-e2e.test`;
}

test.describe('Registro y login', () => {
  test('un usuario se registra, inicia sesión y llega al dashboard', async ({ page }) => {
    const email = emailUnico();
    const password = 'Test1234!';

    await page.goto('/auth/registro');
    await page.getByPlaceholder('Tu nombre').fill('E2E Playwright');
    await page.getByPlaceholder('tu@email.com').fill(email);
    await page.getByPlaceholder('••••••••').first().fill(password);
    await page.getByPlaceholder('••••••••').nth(1).fill(password);
    await page.getByRole('button', { name: 'Registrarse' }).click();

    // register() redirige a /auth/login?registrado=1 (no auto-loguea) —
    // el toast de éxito confirma que el registro se aceptó.
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(toast(page, /revisá tu email para verificarla/i)).toBeVisible();

    await page.getByPlaceholder('tu@email.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // La verificación de email NO bloquea el login (ver CLAUDE.md) — una
    // cuenta recién creada y sin verificar debe poder entrar igual.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Mis Cursos' })).toBeVisible();
  });

  test('login con credenciales inválidas muestra un error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('tu@email.com').fill('no-existe@suenosdev-e2e.test');
    await page.getByPlaceholder('••••••••').fill('loquesea123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await expect(toast(page, /Credenciales inválidas/)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
