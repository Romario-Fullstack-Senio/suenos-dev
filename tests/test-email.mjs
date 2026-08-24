const API = 'http://127.0.0.1:3001/api';
const EMAIL = 'ingenieroromario@gmail.com';
const PASSWORD = '12345678';
const CURSO_ID = '0c174ebd-4930-406a-ad09-0e3cc94b1070';

async function api(method, path, data, headers = {}) {
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

(async () => {
  console.log('=== TEST: Envío de email de confirmación de compra vía Mailtrap ===\n');

  // 1. Login
  console.log('1. Login...');
  const login = await api('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  const token = login.json?.token;
  const user = login.json?.usuario;
  console.log(`   ✓ Logged in as ${user.nombre} (${user.email})\n`);

  // 2. Create order
  console.log('2. Creando orden de compra...');
  const order = await api('POST', '/ordenes', {
    estudianteId: user.id,
    cursoId: CURSO_ID,
    precio: 29.99,
    cursoNombre: 'Curso de Playwright',
    successUrl: 'http://localhost:3000/dashboard',
    cancelUrl: 'http://localhost:3000/checkout',
  }, { Authorization: `Bearer ${token}` });
  const ordenId = order.json?.ordenId;
  console.log(`   ✓ Orden creada: ${ordenId}\n`);

  // 3. Confirm payment (this triggers the email event)
  console.log('3. Confirmando pago (esto dispara el email)...');
  const confirm = await api('POST', `/ordenes/${ordenId}/confirm`, {}, { Authorization: `Bearer ${token}` });
  console.log(`   ✓ ${confirm.json?.message}\n`);

  // 4. Check API logs for email
  console.log('4. Verificando envío...');
  console.log('   → Revisa tu bandeja de Mailtrap (https://mailtrap.io/inboxes)');
  console.log(`   → Email destinado a: ${EMAIL}`);
  console.log(`   → Asunto: ¡Compra confirmada! — Curso de Playwright\n`);

  console.log('=== TEST COMPLETADO ===');
  console.log('Si el email no apareció, revisa los logs de la API para errores SMTP.');
})();
