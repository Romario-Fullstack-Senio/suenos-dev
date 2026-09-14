/**
 * Formateo de precios y fechas en un solo lugar. Antes cada vista imprimía
 * `${curso.precio} USD` crudo (49.99 y 49.9 quedaban desalineados en la
 * misma grilla) y fechas con `toLocaleDateString()` sin locale, que cambia
 * de formato según la máquina del usuario en un producto que es todo en
 * español.
 */

const PRECIO = new Intl.NumberFormat('es', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FECHA = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/** 49.9 -> "US$ 49,90". Acepta el number o el string que devuelve el API. */
export function formatearPrecio(precio: number | string | null | undefined): string {
  const valor = typeof precio === 'string' ? Number(precio) : precio;
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  if (valor === 0) return 'Gratis';
  return PRECIO.format(valor);
}

/** ISO -> "12 sept 2026". Devuelve '—' si la fecha falta o es inválida. */
export function formatearFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—';
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return FECHA.format(d);
}
