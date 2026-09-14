/**
 * Badges de estado con pares de color semánticos. Antes se usaba
 * `text-green-400` sobre `bg-green-500/15` — elegido pensando en el tema
 * oscuro y prácticamente ilegible en tema claro (verde claro sobre blanco
 * teñido). Ahora el color sale de las variables `--color-success/warning/
 * danger`, que globals.css define distinto en cada tema.
 */

type Tono = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONO_CLASS: Record<Tono, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-primary/10 text-primary',
  neutral: 'bg-ink/[0.08] text-ink-muted',
};

export function Badge({
  tono = 'neutral',
  children,
  className = '',
}: {
  tono?: Tono;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${TONO_CLASS[tono]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Estado de un curso en vistas internas (admin, instructor). */
const CURSO_ESTADO: Record<string, { tono: Tono; label: string }> = {
  publicado: { tono: 'success', label: 'Publicado' },
  borrador: { tono: 'warning', label: 'Borrador' },
  archivado: { tono: 'neutral', label: 'Archivado' },
};

export function EstadoCursoBadge({ estado, className = '' }: { estado: string; className?: string }) {
  const config = CURSO_ESTADO[estado] ?? { tono: 'neutral' as Tono, label: estado };
  return <Badge tono={config.tono} className={className}>{config.label}</Badge>;
}
