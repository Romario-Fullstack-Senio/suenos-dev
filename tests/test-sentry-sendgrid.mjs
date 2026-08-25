const API = 'http://127.0.0.1:3001/api';

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
  console.log('=== TEST: Sentry + SendGrid Config ===\n');

  // 1. Health check
  console.log('1. Health check...');
  const health = await api('GET', '/health');
  console.log(`   ✓ Status: ${health.json?.status}\n`);

  // 2. Test Sentry DSN config
  console.log('2. Sentry configuration...');
  console.log('   → Si no ves SENTRY_DSN en .env, Sentry está deshabilitado (modo dev)');
  console.log('   → Para habilitar: crea cuenta en sentry.io y agrega tu DSN a .env\n');

  // 3. Test SendGrid config
  console.log('3. SendGrid configuration...');
  console.log('   → Si no ves SENDGRID_API_KEY en .env, usa Mailtrap (dev)');
  console.log('   → Para habilitar: crea cuenta en sendgrid.com y agrega tu API key a .env\n');

  // 4. Test email sending
  console.log('4. Testing email adapter selection...');
  const testLogin = await api('POST', '/auth/login', {
    email: 'ingenieroromario@gmail.com',
    password: '12345678',
  });
  const token = testLogin.json?.token;
  
  if (token) {
    // Create a test order to trigger email
    const order = await api('POST', '/ordenes', {
      estudianteId: testLogin.json?.usuario?.id,
      cursoId: '0c174ebd-4930-406a-ad09-0e3cc94b1070',
      precio: 29.99,
      cursoNombre: 'Curso de Playwright (Test SendGrid)',
      successUrl: 'http://localhost:3000/dashboard',
      cancelUrl: 'http://localhost:3000/checkout',
    }, { Authorization: `Bearer ${token}` });
    
    if (order.json?.ordenId) {
      const confirm = await api('POST', `/ordenes/${order.json.ordenId}/confirm`, {}, { Authorization: `Bearer ${token}` });
      console.log(`   ✓ Email test triggered: ${confirm.json?.message}\n`);
    }
  }

  console.log('=== RESUMEN ===');
  console.log('Sentry: Configurado en API y Frontend');
  console.log('  → Agrega SENTRY_DSN a apps/api/.env para activar');
  console.log('  → Agrega NEXT_PUBLIC_SENTRY_DSN a apps/web/.env.local para activar');
  console.log('');
  console.log('SendGrid: Configurado como fallback de Nodemailer');
  console.log('  → Agrega SENDGRID_API_KEY a apps/api/.env para producción');
  console.log('  → Sin API key: usa Mailtrap (desarrollo)');
  console.log('');
  console.log('Revisa Mailtrap para ver si el email fue enviado.');
})();
