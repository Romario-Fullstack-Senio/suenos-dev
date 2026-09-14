import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface EstadoVacioProps {
  icono?: LucideIcon;
  titulo: string;
  texto?: string;
  cta?: { href: string; label: string };
  /** Acción en vez de navegación (ej. "Limpiar filtros"). */
  accion?: { onClick: () => void; label: string };
  /** `card` mete el vacío en una superficie; `plano` lo deja suelto (para
   *  cuando ocupa la página entera). */
  variante?: 'card' | 'plano';
}

/**
 * Estado vacío único para toda la web. Antes cada pantalla improvisaba el
 * suyo: algunas solo decían que no había nada, sin ofrecer la acción
 * siguiente con peso suficiente, y el margen y el tamaño de texto cambiaban
 * de una a otra.
 */
export function EstadoVacio({
  icono: Icono,
  titulo,
  texto,
  cta,
  accion,
  variante = 'card',
}: EstadoVacioProps) {
  return (
    <div
      className={`text-center px-6 py-16 ${
        variante === 'card' ? 'card' : ''
      }`}
    >
      {Icono && <Icono className="w-12 h-12 text-ink-soft mx-auto mb-4" aria-hidden />}
      <h2 className="text-xl font-bold text-ink mb-2">{titulo}</h2>
      {texto && <p className="text-ink-muted max-w-md mx-auto mb-6">{texto}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="inline-block bg-primary text-on-brand px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
        >
          {cta.label}
        </Link>
      )}
      {accion && (
        <button
          type="button"
          onClick={accion.onClick}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {accion.label}
        </button>
      )}
    </div>
  );
}
