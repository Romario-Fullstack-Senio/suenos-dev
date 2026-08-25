'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Algo salió mal
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
