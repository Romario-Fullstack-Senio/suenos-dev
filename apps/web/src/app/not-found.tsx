import Link from 'next/link';
import { Compass } from 'lucide-react';

/**
 * 404 propio. Antes no existía: una URL de curso inexistente (o cualquier
 * ruta mal tipeada) caía en la pantalla por defecto de Next, sin header ni
 * tema, y sin ninguna salida hacia el catálogo.
 */
export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <Compass className="w-12 h-12 text-ink-soft mx-auto mb-5" aria-hidden />
      <p className="font-mono text-sm text-ink-soft mb-2">404</p>
      <h1 className="text-2xl font-bold text-ink mb-2">Esta página no existe</h1>
      <p className="text-ink-muted mb-8">
        El enlace puede estar roto o el contenido ya no está disponible.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/cursos" className="btn-primary">
          Ver cursos
        </Link>
        <Link href="/" className="btn-ghost">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
