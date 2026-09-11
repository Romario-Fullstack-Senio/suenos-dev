// ============================================================
// Seed mínimo para la suite E2E.
//
// En CI la base arranca VACÍA (solo corren las migraciones), así que el
// catálogo no tiene ni un curso: catalog.spec.ts no encontraba ningún
// link `a[href^="/cursos/"]` y purchase-flow.spec.ts no tenía nada que
// comprar. Local suele pasar desapercibido porque la base de desarrollo
// ya tiene cursos cargados a mano.
//
// Crea un instructor y un curso PUBLICADO con un módulo y dos lecciones.
// Es idempotente: si el curso ya existe (corrida repetida contra la misma
// base), no hace nada.
//
// Uso: node e2e/seed.mjs
// ============================================================
import pg from 'pg';

const API = process.env.E2E_API_URL || 'http://127.0.0.1:3001/api';
const SLUG = 'curso-e2e-seed';
const EMAIL = 'e2e-seed-instructor@suenosdev-e2e.test';
const PASSWORD = 'Test1234!';

const client = new pg.Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin',
  database: process.env.DATABASE_NAME || 'suenos-dev',
});

async function pedir(metodo, ruta, { token, body } = {}) {
  const res = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`${metodo} ${ruta} → ${res.status}: ${texto.slice(0, 200)}`);
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

await client.connect();

const { rows: yaExiste } = await client.query(`SELECT id FROM cursos WHERE slug = $1`, [SLUG]);
if (yaExiste.length > 0) {
  console.log(`seed: el curso "${SLUG}" ya existe (${yaExiste[0].id}) — nada que hacer`);
  await client.end();
  process.exit(0);
}

// 1. Instructor. El registro siempre crea un 'estudiante'; el rol se sube
//    por SQL porque PUT /usuarios/:id/rol exige un admin que todavía no hay.
await pedir('POST', '/auth/registro', {
  body: { nombre: 'Instructor E2E', email: EMAIL, password: PASSWORD },
}).catch((err) => {
  // Si ya estaba registrado de una corrida anterior, seguimos.
  if (!String(err.message).includes('409') && !/ya est|already/i.test(err.message)) throw err;
});
await client.query(
  `UPDATE usuarios SET rol = 'instructor', email_verificado = true WHERE email = $1`,
  [EMAIL],
);
const { rows: usuarios } = await client.query(`SELECT id FROM usuarios WHERE email = $1`, [EMAIL]);
const instructorId = usuarios[0].id;

const { token } = await pedir('POST', '/auth/login', { body: { email: EMAIL, password: PASSWORD } });

// 2. Curso + módulo + lecciones. Publicar exige al menos un módulo.
const curso = await pedir('POST', '/cursos', {
  token,
  body: {
    titulo: 'Curso E2E Seed',
    descripcion: 'Curso creado automáticamente para que la suite E2E tenga catálogo con contenido.',
    precio: 19.99,
    instructorId,
    categoria: 'Programación',
    nivel: 'principiante',
  },
});

const { moduloId } = await pedir('POST', `/cursos/${curso.id}/modulos`, {
  token,
  body: { titulo: 'Módulo 1', orden: 1 },
});

await pedir('POST', `/cursos/${curso.id}/modulos/${moduloId}/lecciones`, {
  token,
  body: { titulo: 'Lección de bienvenida', orden: 1, duracionSegundos: 60, esVistaPrevia: true },
});
await pedir('POST', `/cursos/${curso.id}/modulos/${moduloId}/lecciones`, {
  token,
  body: { titulo: 'Segunda lección', orden: 2, duracionSegundos: 90 },
});

await pedir('POST', `/cursos/${curso.id}/publicar`, { token });

const { rows: verificacion } = await client.query(
  `SELECT slug, estado FROM cursos WHERE id = $1`,
  [curso.id],
);
console.log(`seed: curso "${verificacion[0].slug}" creado y ${verificacion[0].estado} (${curso.id})`);

if (verificacion[0].estado !== 'publicado') {
  console.error('seed: el curso no quedó publicado — el catálogo seguiría vacío');
  await client.end();
  process.exit(1);
}

await client.end();
