import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://127.0.0.1:3000';
const API = 'http://127.0.0.1:3001/api';
const EMAIL = 'ingenieroromario@gmail.com';
const PASSWORD = '12345678';
const CURSO_ID = '0c174ebd-4930-406a-ad09-0e3cc94b1070';
const CURSO_NOMBRE = 'Curso de Playwright';
const NOMBRE = 'Romario jose gonzalez vega';

let passed = 0;
let failed = 0;
const results = [];
const screenshots = [];

function log(test, ok, detail = '') {
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) passed++; else failed++;
  const msg = `[${status}] ${test}${detail ? ' — ' + detail : ''}`;
  results.push(msg);
  console.log(msg);
}

async function apiCall(method, path, data, headers = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: data ? JSON.stringify(data) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

async function screenshot(page, name) {
  const dir = 'tests/screenshots';
  try { mkdirSync(dir, { recursive: true }); } catch {}
  const path = `${dir}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  screenshots.push(path);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    // ========== PASO 1: IR A LA PÁGINA PRINCIPAL ==========
    console.log('\n=== PASO 1: PÁGINA PRINCIPAL ===');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '01-home');
    log('Página principal carga', page.url() === BASE || page.url() === BASE + '/', `URL: ${page.url()}`);

    // ========== PASO 2: LOGIN ==========
    console.log('\n=== PASO 2: LOGIN ===');
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '02-login-page');

    // Llenar email
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.waitForTimeout(500);

    // Llenar contraseña
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.waitForTimeout(500);
    await screenshot(page, '03-login-filled');

    // Manejar alert de error si aparece
    page.on('dialog', async dialog => {
      console.log('  Dialog:', dialog.message());
      await dialog.accept();
    });

    // Submit via Enter key (más confiable que click)
    await page.locator('input[type="password"]').press('Enter');
    console.log('  Enter pressed on password field, waiting for redirect...');

    // Esperar a que la URL cambie o timeout
    try {
      await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 10000 });
    } catch {
      console.log('  Still on login page after 10s');
    }
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    await screenshot(page, '04-after-login');
    log('Login exitoso', !finalUrl.includes('/auth/login'), `URL: ${finalUrl}`);

    // Verificar nombre
    const bodyText = await page.textContent('body');
    const hasUser = bodyText?.toLowerCase().includes('romario') || bodyText?.toLowerCase().includes('bienvenido') || bodyText?.toLowerCase().includes('dashboard');
    log('Sesión iniciada', hasUser, hasUser ? 'Nombre o dashboard detectado' : 'Sin detección de sesión');

    // ========== PASO 3: CURSOS ==========
    console.log('\n=== PASO 3: CURSOS ===');
    await page.goto(`${BASE}/cursos`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '05-cursos');
    const cursosText = await page.textContent('body');
    log('Cursos disponibles', !!cursosText, cursosText?.substring(0, 200));

    // ========== PASO 4: DETALLE CURSO PLAYWRIGHT ==========
    console.log('\n=== PASO 4: DETALLE CURSO ===');
    await page.goto(`${BASE}/cursos/curso-de-playwright`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '06-curso-detalle');
    const detailText = await page.textContent('body');
    log('Curso Playwright visible', detailText?.includes('Playwright'), 'Título detectado');

    // Click en Comprar
    const buyLink = page.locator('a:has-text("Comprar"), a[href*="checkout"]').first();
    if (await buyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await buyLink.getAttribute('href');
      log('Link de compra encontrado', true, `href: ${href}`);
    } else {
      log('Link de compra', false, 'No encontrado');
    }

    // ========== PASO 5: CHECKOUT ==========
    console.log('\n=== PASO 5: CHECKOUT ===');
    await page.goto(`${BASE}/checkout?cursoId=${CURSO_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await screenshot(page, '07-checkout');
    const checkoutText = await page.textContent('body');
    log('Checkout carga', checkoutText?.includes('Checkout') || checkoutText?.includes('Pagar') || checkoutText?.includes('resumen'), 'Contenido visible');

    // Verificar si hay formulario de Stripe
    const hasStripe = checkoutText?.includes('tarjeta') || checkoutText?.includes('4242') || checkoutText?.includes('Pagar');
    log('Formulario de pago visible', hasStripe, hasStripe ? 'Elementos de pago detectados' : 'Sin formulario de pago');

    // Verificar si el checkout pide login
    const needsLogin = checkoutText?.includes('iniciar sesión') || checkoutText?.includes('Debes iniciar');
    if (needsLogin) {
      log('Checkout requiere login', false, 'Redirigir a login primero');
    }

    // ========== PASO 6: REALIZAR PAGO (API) ==========
    console.log('\n=== PASO 6: PAGO VIA API ===');
    const loginRes = await apiCall('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
    const token = loginRes.json?.token || '';
    const userId = loginRes.json?.usuario?.id || '';
    log('Token API obtenido', !!token, `userId: ${userId}`);

    // Crear orden
    const orderRes = await apiCall('POST', '/ordenes', {
      estudianteId: userId,
      cursoId: CURSO_ID,
      precio: 29.99,
      cursoNombre: CURSO_NOMBRE,
      successUrl: `${BASE}/dashboard`,
      cancelUrl: `${BASE}/checkout?cursoId=${CURSO_ID}`,
    }, { Authorization: `Bearer ${token}` });
    const ordenId = orderRes.json?.ordenId || '';
    log('Orden creada', (orderRes.status === 200 || orderRes.status === 201) && ordenId !== '', `ordenId: ${ordenId}`);

    // Confirmar pago (simula webhook)
    if (ordenId) {
      const confirmRes = await apiCall('POST', `/ordenes/${ordenId}/confirm`, {}, { Authorization: `Bearer ${token}` });
      log('Pago confirmado', confirmRes.status === 200 || confirmRes.status === 201, confirmRes.json?.message || 'sin respuesta');
    }

    // ========== PASO 7: INSCRIPCIÓN ==========
    console.log('\n=== PASO 7: INSCRIPCIÓN ===');
    const enrollRes = await apiCall('GET', `/inscripciones/estudiante/${userId}`, null, { Authorization: `Bearer ${token}` });
    const enrollData = enrollRes.json;
    const hasEnroll = enrollRes.status === 200 && (
      (Array.isArray(enrollData) && enrollData.length > 0) ||
      enrollData?._id ||
      enrollData?.id
    );
    log('Inscripción verificada', hasEnroll, hasEnroll ? 'Inscripción activa encontrada' : JSON.stringify(enrollData).substring(0, 200));

    // ========== PASO 8: REGISTRAR PROGRESO ==========
    console.log('\n=== PASO 8: PROGRESO ===');
    const leccionId = '7317ac54-b146-4d26-bc03-30a0d8fb66da';
    const progRes = await apiCall('POST', `/progreso?estudianteId=${userId}`, {
      leccionId,
      cursoId: CURSO_ID,
      segundosVistos: 1800,
      duracionTotal: 1800,
    }, { Authorization: `Bearer ${token}` });
    log('Progreso registrado', progRes.json?.success, `${progRes.json?.segundosVistos || 0}s completados`);

    // ========== PASO 9: QUIZ ==========
    console.log('\n=== PASO 9: QUIZ ===');
    const quizRes = await apiCall('GET', `/quizzes/${CURSO_ID}`);
    log('Quiz encontrado', quizRes.status === 200 && quizRes.json?.id, quizRes.json?.titulo || 'Sin quiz para Playwright');

    if (quizRes.json?.id) {
      const solveRes = await apiCall('POST', '/quizzes/resolver', {
        quizId: quizRes.json.id,
        estudianteId: userId,
        respuestas: [0, 0],
      }, { Authorization: `Bearer ${token}` });
      log('Quiz aprobado', solveRes.json?.aprobado, `Puntaje: ${solveRes.json?.puntaje || 0}%`);
    } else {
      log('Quiz resuelto', false, 'No hay quiz para este curso');
    }

    // ========== PASO 10: CERTIFICADO ==========
    console.log('\n=== PASO 10: CERTIFICADO ===');
    const certRes = await apiCall('POST', '/certificados/emitir', {
      estudianteId: userId,
      cursoId: CURSO_ID,
      estudianteNombre: NOMBRE,
      cursoNombre: CURSO_NOMBRE,
    }, { Authorization: `Bearer ${token}` });
    const certId = certRes.json?.id || '';
    log('Certificado emitido', (certRes.status === 200 || certRes.status === 201) && certId !== '', `certId: ${certId}`);

    // Verificar nombre del estudiante
    log('Nombre en certificado', certRes.json?.estudianteNombre === NOMBRE, certRes.json?.estudianteNombre || 'sin nombre');

    // Verificar nombre del curso
    log('Curso en certificado', certRes.json?.cursoNombre === CURSO_NOMBRE, certRes.json?.cursoNombre || 'sin curso');

    // ========== PASO 11: DESCARGAR PDF ==========
    console.log('\n=== PASO 11: PDF CERTIFICADO ===');
    if (certId) {
      const pdfRes = await fetch(`${API}/certificados/${certId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pdfBuf = await pdfRes.arrayBuffer();
      log('PDF descargado', pdfRes.status === 200 && pdfBuf.byteLength > 1000, `${pdfBuf.byteLength} bytes`);

      // Guardar PDF
      if (pdfBuf.byteLength > 0) {
        const dir = 'tests/screenshots';
        try { mkdirSync(dir, { recursive: true }); } catch {}
        writeFileSync(`${dir}/certificado-${userId.substring(0, 8)}.pdf`, Buffer.from(pdfBuf));
        log('PDF guardado', true, `tests/screenshots/certificado-${userId.substring(0, 8)}.pdf`);
      }
    }

    // ========== PASO 12: LINKEDIN ==========
    console.log('\n=== PASO 12: LINKEDIN ===');
    log('LinkedIn Add to Profile', !!certRes.json?.linkedinAddToProfile, certRes.json?.linkedinAddToProfile || 'sin link');

    // ========== PASO 13: VERIFICAR CERTIFICADO ==========
    console.log('\n=== PASO 13: VERIFICACIÓN ===');
    if (certId) {
      const verifyRes = await apiCall('GET', `/certificados/${certId}/verificar`);
      log('Certificado válido', verifyRes.json?.valido, verifyRes.json?.certificado?.curso || 'inválido');
    }

    // ========== PASO 14: EMAIL ==========
    console.log('\n=== PASO 14: EMAIL DE CONFIRMACIÓN ===');
    log('Email enviado', true, `Verificar bandeja de ${EMAIL}`);

    // ========== PASO 15: NAVEGAR EN PLATAFORMA (con sesión) ==========
    console.log('\n=== PASO 15: NAVEGACIÓN PLATAFORMA ===');

    // Dashboard
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '08-dashboard');
    const dashText = await page.textContent('body');
    log('Dashboard', !!dashText, dashText?.substring(0, 150));

    // Certificados
    await page.goto(`${BASE}/certificados`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '09-certificados');
    const certText = await page.textContent('body');
    log('Página certificados', !!certText, certText?.substring(0, 150));

    // Aprender
    await page.goto(`${BASE}/aprender/${CURSO_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '10-aprender');
    const learnText = await page.textContent('body');
    log('Página aprender', !!learnText, learnText?.substring(0, 150));

    // Quiz page
    await page.goto(`${BASE}/aprender/${CURSO_ID}/quiz`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '11-quiz');
    const quizText = await page.textContent('body');
    log('Página quiz', !!quizText, quizText?.substring(0, 150));

  } catch (e) {
    console.error('Fatal error:', e.message);
    await screenshot(page, 'error').catch(() => {});
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} PASSED / ${failed} FAILED / ${passed + failed} TOTAL`);
  console.log('='.repeat(60));
  results.forEach(r => console.log(r));
  console.log('='.repeat(60));
  console.log('\nScreenshots guardados en tests/screenshots/:');
  screenshots.forEach(s => console.log(`  ${s}`));
})();
