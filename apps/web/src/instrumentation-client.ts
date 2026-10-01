import * as Sentry from '@sentry/nextjs';

// Ex sentry.client.config.ts: con Next 16 el build usa Turbopack, y Sentry ya
// no inyecta ese archivo — el init del navegador tiene que vivir en la
// convención instrumentation-client de Next.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
    }
    return event;
  },
});

// Traza las navegaciones client-side del App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
