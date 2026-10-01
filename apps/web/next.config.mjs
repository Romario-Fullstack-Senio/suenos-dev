// Sentry 11 movió withSentryConfig a su propio entry point (ya no se exporta
// desde '@sentry/nextjs').
import { withSentryConfig } from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOT 'standalone': in this npm-workspaces monorepo, on Alpine, Next's
  // output-file-tracing step consistently produced a completely empty
  // .next/standalone/node_modules (tried with and without an explicit
  // outputFileTracingRoot pointed at the repo root — same result both
  // ways), so the container crashed at boot with "Cannot find module
  // 'next'" on every deploy. apps/web/Dockerfile instead ships a pruned
  // full node_modules and runs `next start`, the same reliable pattern
  // apps/api/Dockerfile already uses.
};

// Sentry 11 + Next 16 (Turbopack por defecto): `hideSourceMaps` ya no existe
// (los sourcemaps se borran tras subirlos por defecto, deleteSourcemapsAfterUpload),
// y `disableLogger` / `automaticVercelMonitors` pasaron a opciones solo de
// webpack/Vercel — ninguna aplica a este build, así que se quitaron.
export default withSentryConfig(nextConfig, {
  org: 'suenos-dev',
  project: 'web',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/api/sentry',
});
