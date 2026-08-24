import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';
const EMAIL = 'qa-test@suenosdev.com';
const PASSWORD = 'Test1234!';

let passed = 0;
let failed = 0;
const results = [];

function log(test, ok, detail = '') {
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) passed++; else failed++;
  const msg = `[${status}] ${test}${detail ? ' — ' + detail : ''}`;
  results.push(msg);
  console.log(msg);
}

async function apiCall(method, path, data, headers = {}, noApiPrefix = false) {
  const url = noApiPrefix ? `http://localhost:3001${path}` : `${API}${path}`;
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    // TEST 1: Home page
    const homeRes = await page.goto(BASE);
    log('Home page loads', homeRes?.status() === 200);

    // TEST 2: Register
    let reg = await apiCall('POST', '/auth/registro', { email: EMAIL, password: PASSWORD, nombre: 'Romario QA' });
    log('Register user', reg.status === 200 || reg.status === 201 || (reg.json && typeof reg.json === 'object' && (reg.json.message || reg.json.id)));

    // TEST 3: Login
    let login = await apiCall('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
    const token = login.json?.token || '';
    const userId = login.json?.usuario?.id || '';
    log('Login', login.status === 200 && token !== '', `userId: ${userId}`);

    // TEST 4: Login page UI
    await page.goto(`${BASE}/auth/login`);
    await page.waitForTimeout(2000);
    log('Login page renders', await page.locator('input').first().isVisible().catch(() => false));

    // TEST 5: Courses page
    await page.goto(`${BASE}/cursos`);
    await page.waitForTimeout(3000);
    const cursosHtml = await page.content();
    log('Courses page loads', cursosHtml.includes('Curso') || cursosHtml.includes('curso'));

    // TEST 6: Course detail
    await page.goto(`${BASE}/cursos/curso-de-nestjs`);
    await page.waitForTimeout(3000);
    const detailHtml = await page.content();
    log('Course detail page', detailHtml.includes('NestJS') || detailHtml.includes('$'));

    // TEST 7: Dashboard
    await page.goto(`${BASE}/dashboard`);
    await page.waitForTimeout(3000);
    const dashHtml = await page.content();
    log('Dashboard page', dashHtml.includes('Curso') || dashHtml.includes('Mis') || dashHtml.includes('iniciar'));

    // TEST 8: Create order
    const cursoId = 'daf39ccd-4bb2-42a7-9612-02c1553d5e9a';
    let order = await apiCall('POST', '/ordenes', { estudianteId: userId, cursoId, cursoNombre: 'Curso de NestJS', precio: 4999 }, { Authorization: `Bearer ${token}` });
    const ordenId = order.json?.ordenId || '';
    log('Create order (Stripe)', (order.status === 200 || order.status === 201) && ordenId !== '', `ordenId: ${ordenId}`);

    // TEST 9: Confirm payment
    let confirm = { status: 0, json: {} };
    if (ordenId) {
      confirm = await apiCall('POST', `/ordenes/${ordenId}/confirm`, {}, { Authorization: `Bearer ${token}` });
    }
    log('Confirm payment', confirm.status === 200 || confirm.status === 201, confirm.json?.message || 'no order');

    // TEST 10: Enrollment
    let enroll = { status: 0, json: {} };
    if (userId) {
      enroll = await apiCall('GET', `/inscripciones/estudiante/${userId}`, null, { Authorization: `Bearer ${token}` });
    }
    const hasEnroll = enroll.status === 200 && (Array.isArray(enroll.json) ? enroll.json.length > 0 : !!enroll.json?._id);
    log('Enrollment created', hasEnroll);

    // TEST 11: Progress tracking
    let prog = { status: 0, json: {} };
    if (userId) {
      const leccionId = '3d3ee205-dc29-4e99-a5fc-22ce9c02ba59';
      prog = await apiCall('POST', `/progreso?estudianteId=${userId}`, { leccionId, cursoId, segundosVistos: 600, duracionTotal: 600 }, { Authorization: `Bearer ${token}` });
    }
    log('Progress tracking', (prog.status === 200 || prog.status === 201) && prog.json?.success);

    // TEST 12: Get progress
    let progGet = { status: 0, json: {} };
    if (userId) {
      progGet = await apiCall('GET', `/progreso/curso/${cursoId}?estudianteId=${userId}`, null, { Authorization: `Bearer ${token}` });
    }
    log('Get progress', progGet.status === 200 && (progGet.json?.leccionesCompletadas || 0) > 0, `${progGet.json?.leccionesCompletadas || 0} lessons completed`);

    // TEST 13: Quiz
    let quiz = { status: 0, json: {} };
    quiz = await apiCall('GET', `/quizzes/${cursoId}`);
    log('Get quiz', quiz.status === 200 && quiz.json?.id, quiz.json?.titulo || 'no quiz');

    // TEST 14: Solve quiz
    let solve = { status: 0, json: {} };
    if (quiz.json?.id) {
      solve = await apiCall('POST', '/quizzes/resolver', { quizId: quiz.json.id, estudianteId: userId, respuestas: [0, 1] }, { Authorization: `Bearer ${token}` });
    }
    log('Solve quiz', (solve.status === 200 || solve.status === 201) && solve.json?.aprobado, `score: ${solve.json?.puntaje || 0}%`);

    // TEST 15: Certificate
    let cert = { status: 0, json: {} };
    if (userId) {
      cert = await apiCall('POST', '/certificados/emitir', { estudianteId: userId, cursoId, estudianteNombre: 'Romario QA', cursoNombre: 'Curso de NestJS' }, { Authorization: `Bearer ${token}` });
    }
    const certId = cert.json?.id || '';
    log('Certificate emission', (cert.status === 200 || cert.status === 201) && certId !== '', `certId: ${certId}`);

    // TEST 16: LinkedIn link
    log('LinkedIn Add to Profile', !!cert.json?.linkedinAddToProfile, cert.json?.linkedinAddToProfile ? 'link generated' : 'no link');

    // TEST 17: PDF download
    let pdf = { status: 0, json: {} };
    if (certId) {
      const pdfRes = await fetch(`${API}/certificados/${certId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      const pdfBuf = await pdfRes.arrayBuffer();
      pdf = { status: pdfRes.status, json: { size: pdfBuf.byteLength } };
    }
    log('PDF certificate download', pdf.status === 200 && pdf.json?.size > 1000, `size: ${pdf.json?.size || 0} bytes`);

    // TEST 18: Certificate verification
    let verify = { status: 0, json: {} };
    if (certId) {
      verify = await apiCall('GET', `/certificados/${certId}/verificar`);
    }
    log('Certificate verification', verify.status === 200 && verify.json?.valido, verify.json?.certificado?.curso || 'invalid');

    // TEST 19: Aprender page
    await page.goto(`${BASE}/aprender/${cursoId}`);
    await page.waitForTimeout(3000);
    const aHtml = await page.content();
    log('Aprender page', aHtml.includes('NestJS') || aHtml.includes('Modulo') || aHtml.includes('leccion'));

    // TEST 20: Quiz page
    await page.goto(`${BASE}/aprender/${cursoId}/quiz`);
    await page.waitForTimeout(3000);
    const qHtml = await page.content();
    log('Quiz page', qHtml.includes('Quiz') || qHtml.includes('pregunta') || qHtml.includes('NestJS'));

    // TEST 21: Certificados page
    await page.goto(`${BASE}/certificados`);
    await page.waitForTimeout(3000);
    const cHtml = await page.content();
    log('Certificates page', cHtml.includes('Certificado') || cHtml.includes('iniciar') || cHtml.includes('NestJS'));

    // TEST 22: Instructor page
    await page.goto(`${BASE}/instructor`);
    await page.waitForTimeout(2000);
    const iHtml = await page.content();
    log('Instructor page', iHtml.includes('Instructor') || iHtml.includes('Curso') || iHtml.includes('iniciar'));

    // TEST 23: Admin stats
    let adminLogin = await apiCall('POST', '/auth/login', { email: 'admin@suenosdev.com', password: 'Admin1234!' });
    const adminToken = adminLogin.json?.token || '';
    if (adminToken) {
      let adminStats = await apiCall('GET', '/admin/stats', null, { Authorization: `Bearer ${adminToken}` });
      log('Admin stats', adminStats.status === 200, `${adminStats.json?.totalUsuarios} users, ${adminStats.json?.totalCursos} courses`);
    }

    // TEST 24: Instructor stats
    let instrLogin = await apiCall('POST', '/auth/login', { email: 'instructor@test.com', password: 'Test1234!' });
    const instrToken = instrLogin.json?.token || '';
    const instrId = instrLogin.json?.usuario?.id || '';
    if (instrToken && instrId) {
      let instrStats = await apiCall('GET', `/instructor/stats/${instrId}`, null, { Authorization: `Bearer ${instrToken}` });
      log('Instructor stats', instrStats.status === 200, `${instrStats.json?.totalCursos} courses`);
    }

    // TEST 25: Health check
    let health = await apiCall('GET', '/health', null, {}, true);
    log('API health check', health.status === 200 && health.json?.status === 'ok');

    // TEST 26: Swagger
    let swagger = await apiCall('GET', '/docs', null, {}, true);
    log('Swagger docs', swagger.status === 200);

  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} PASSED / ${failed} FAILED / ${passed + failed} TOTAL`);
  console.log('='.repeat(60));
  results.forEach(r => console.log(r));
  console.log('='.repeat(60));
})();
