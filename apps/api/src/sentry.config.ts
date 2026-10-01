import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    // Sentry 11 quitó el muestreo de profiling por transacción
    // (profilesSampleRate): ahora se muestrea por sesión — en Node, la vida
    // del proceso — y 'trace' perfila mientras haya un trace activo.
    profileSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profileLifecycle: 'trace',
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
      }
      if (event.extra?.password) {
        delete event.extra.password;
      }
      return event;
    },
  });
}
