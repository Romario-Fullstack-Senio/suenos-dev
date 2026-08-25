import * as Sentry from '@sentry/nextjs';

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
