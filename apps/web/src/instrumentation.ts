import * as Sentry from '@sentry/nextjs';

// Punto de entrada que Next carga en el servidor antes de servir requests.
// Antes no existía: sentry.server.config.ts y sentry.edge.config.ts estaban
// en el repo pero nadie los importaba, así que Sentry nunca se inicializó del
// lado del servidor (solo en el navegador).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Errores de Server Components, route handlers y del proxy.
export const onRequestError = Sentry.captureRequestError;
