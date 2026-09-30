interface CourseCoverImageProps {
  imagenUrl?: string;
  titulo: string;
  className?: string;
  /** true para la imagen principal de la página (el banner del detalle, que
   * suele ser el LCP): se carga de inmediato. Las tarjetas del catálogo van
   * en lazy, así no compiten por ancho de banda con lo que está en pantalla. */
  prioridad?: boolean;
}

/**
 * Portada de curso, reutilizada en el card del catálogo y en el banner de
 * la página de detalle. Cuando no hay imagen (cursos existentes antes de
 * esta feature), muestra un degradado de marca con la inicial del título
 * en vez de dejar un hueco vacío o un ícono de imagen rota.
 *
 * <img> y no next/image a propósito: el optimizador de Next necesitaría
 * `images.remotePatterns` con el host de MinIO de cada entorno, y en Next 14
 * esa combinación tiene un advisory de DoS abierto para apps self-hosted.
 */
export function CourseCoverImage({ imagenUrl, titulo, className = '', prioridad = false }: CourseCoverImageProps) {
  if (imagenUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ver comment de arriba
      <img
        src={imagenUrl}
        alt={titulo}
        // Proporción 16:9 de las portadas: el navegador reserva el espacio
        // antes de que llegue la imagen (sin saltos de layout / CLS).
        width={1280}
        height={720}
        loading={prioridad ? 'eager' : 'lazy'}
        decoding="async"
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary to-secondary ${className}`}>
      <span className="text-on-brand/40 font-extrabold text-4xl select-none">
        {titulo.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
