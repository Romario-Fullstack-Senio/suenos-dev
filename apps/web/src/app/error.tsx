'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle } from 'lucide-react';

/**
 * Error boundary de las rutas. Antes solo existía global-error.js, que
 * reemplaza el documento entero con estilos inline: si el API se caía,
 * cualquiera de las ~40 rutas mostraba una pantalla suelta, sin header ni
 * tema. Este error.tsx se renderiza dentro del layout, así que el usuario
 * conserva la navegación y puede irse a otra parte sin recargar.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-5" aria-hidden />
      <h1 className="text-2xl font-bold text-ink mb-2">Algo salió mal</h1>
      <p className="text-ink-muted mb-8">
        No pudimos cargar esta página. Puede ser un problema temporal de conexión con el
        servidor.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Intentar de nuevo
        </button>
        <Link href="/" className="btn-ghost">
          Volver al inicio
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs text-ink-soft font-mono">Referencia: {error.digest}</p>
      )}
    </div>
  );
}
