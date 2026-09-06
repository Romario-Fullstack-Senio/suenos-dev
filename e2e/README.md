# E2E (Playwright)

Suite real de Playwright (`@playwright/test`) — a diferencia de los scripts
ad-hoc en `tests/*.mjs` (`qa-test.mjs`, `test-romario.mjs`: walkthroughs de
una sola pasada, sin runner, sin retries, sin gate en CI), esto corre con
aislamiento por test, reintentos y reporte estructurado, y tiene su propio
job de CI (`.github/workflows/e2e.yml`).

## Qué cubre

- `auth.spec.ts` — registro, login, login con credenciales inválidas.
- `catalog.spec.ts` — listado de cursos, búsqueda con y sin resultados.
- `purchase-flow.spec.ts` — el flujo de punta a punta que más importa
  económicamente: registro → comprar un curso pagando con la tarjeta de
  prueba de Stripe (dentro del PaymentElement embebido, dos iframes
  anidados) → simular el webhook `payment_intent.succeeded` → confirmar
  que la inscripción real se otorgó (aparece en "Mis Cursos" y da acceso
  a `/aprender/:cursoId`) → certificados carga sin errores.

## Correr localmente

Necesita el stack local ya arriba (Postgres/Redis/MinIO + API en :3001 +
Web en :3000) — no lo levanta por sí sola, igual que `tests/*.mjs`:

```bash
npm run docker:up      # Postgres, Redis, MinIO
npm run dev:api        # otra terminal
npm run dev:web        # otra terminal más
npx playwright install chromium   # una sola vez
npm run test:e2e
```

`npm run test:e2e:ui` abre el UI mode de Playwright (útil para debuguear
un test que falla).

## Por qué el checkout no depende de `stripe listen`

`purchase-flow.spec.ts` simula el webhook de Stripe posteando directo a
`POST /stripe/webhook` en vez de depender de que el Stripe CLI esté
reenviando eventos al localhost. Esto funciona porque
`StripeWebhookController` ya tiene un modo sin verificación de firma
cuando `STRIPE_WEBHOOK_SECRET` es el placeholder `whsec_test_secret` de
`.env.example` (pensado originalmente para dev manual, reusado acá para
que la suite sea autocontenida). Con una `STRIPE_WEBHOOK_SECRET` real
configurada, ese atajo no aplica — en ese caso hace falta `stripe listen
--forward-to localhost:3001/api/stripe/webhook` corriendo en paralelo
para que las órdenes lleguen a completarse de verdad.

## Variables de entorno

- `E2E_BASE_URL` — default `http://localhost:3000`.
- `E2E_API_URL` — default `http://127.0.0.1:3001/api` (usada solo por
  `purchase-flow.spec.ts` para simular el webhook).

## Fragilidad conocida

`llenarTarjetaDePrueba()` en `purchase-flow.spec.ts` interactúa con
iframes internos de Stripe Elements (PaymentElement) — su estructura
(nombres de frame, atributos `data-value`) no es una API pública
estable. Si Stripe cambia esto en una actualización mayor de `@stripe/*`,
es esperable que sea este test puntual el que empiece a fallar, no el
resto de la suite.
