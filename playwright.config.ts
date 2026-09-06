import { defineConfig, devices } from '@playwright/test';

// Suite E2E real (npx playwright test), a diferencia de los scripts
// ad-hoc en tests/*.mjs (qa-test.mjs, test-romario.mjs) — esos son
// walkthroughs de una sola pasada sin runner, sin retries, sin reporte
// estructurado y sin gate en CI. Esto sí corre con `@playwright/test`:
// aislamiento por test, retries, trace/screenshot on failure, y (ver
// .github/workflows/e2e.yml) un job de CI dedicado.
//
// Asume un stack local ya corriendo en :3000 (web) / :3001 (api) — igual
// que los scripts de tests/, no levanta los servidores por sí solo porque
// requieren Postgres/Redis/MinIO ya arriba (ver "npm run docker:up").
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
