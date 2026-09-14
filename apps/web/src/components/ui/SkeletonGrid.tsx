/**
 * Skeletons compartidos. Antes cada pantalla esperaba distinto: el catálogo
 * con tarjetas, el detalle con un rectángulo, y otras 20 con el texto
 * "Cargando...", que no reserva espacio y hace saltar el layout cuando
 * llegan los datos.
 */

const BLOQUE = 'bg-ink/[0.06] rounded';

/** Grilla de tarjetas con portada — catálogo, favoritos, relacionados. */
export function SkeletonGrid({ cantidad = 6, columnas = 3 }: { cantidad?: number; columnas?: 2 | 3 }) {
  const cols = columnas === 2 ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid grid-cols-1 ${cols} gap-6`} aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando contenido</span>
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="card overflow-hidden p-0 h-full flex flex-col animate-pulse">
          <div className="w-full aspect-video bg-ink/[0.06]" />
          <div className="p-6 flex flex-col flex-1 gap-2">
            <div className={`h-5 w-3/4 ${BLOQUE}`} />
            <div className={`h-4 w-full ${BLOQUE}`} />
            <div className={`h-4 w-2/3 ${BLOQUE}`} />
            <div className={`h-5 w-1/3 mt-auto ${BLOQUE}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Filas apiladas — listas de órdenes, tickets, hilos, certificados. */
export function SkeletonList({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando contenido</span>
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className={`h-5 w-1/2 ${BLOQUE}`} />
            <div className={`h-4 w-1/3 ${BLOQUE}`} />
          </div>
          <div className={`h-8 w-24 flex-shrink-0 ${BLOQUE}`} />
        </div>
      ))}
    </div>
  );
}

/** Tabla — vistas de admin. */
export function SkeletonTable({ filas = 6, columnas = 4 }: { filas?: number; columnas?: number }) {
  return (
    <div className="card p-0 overflow-hidden" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando contenido</span>
      {Array.from({ length: filas }).map((_, f) => (
        <div
          key={f}
          className="flex items-center gap-4 px-6 py-4 border-b border-ink/[0.06] last:border-0 animate-pulse"
        >
          {Array.from({ length: columnas }).map((_, c) => (
            <div key={c} className={`h-4 ${BLOQUE} ${c === 0 ? 'flex-[2]' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
