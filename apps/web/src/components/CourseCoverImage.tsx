interface CourseCoverImageProps {
  imagenUrl?: string;
  titulo: string;
  className?: string;
}

/**
 * Portada de curso, reutilizada en el card del catálogo y en el banner de
 * la página de detalle. Cuando no hay imagen (cursos existentes antes de
 * esta feature), muestra un degradado de marca con la inicial del título
 * en vez de dejar un hueco vacío o un ícono de imagen rota.
 */
export function CourseCoverImage({ imagenUrl, titulo, className = '' }: CourseCoverImageProps) {
  if (imagenUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa (MinIO), no configurada en next/image
      <img src={imagenUrl} alt={titulo} className={`object-cover ${className}`} />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary to-secondary ${className}`}>
      <span className="text-white/40 font-extrabold text-4xl select-none">
        {titulo.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
