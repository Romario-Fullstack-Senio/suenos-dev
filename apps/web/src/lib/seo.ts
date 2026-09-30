// URL pública del sitio. NEXT_PUBLIC_SITE_URL queda horneada en el build de la
// imagen Docker (build-arg por rama en build-and-push.yml) — metadataBase,
// canonical, sitemap, robots y JSON-LD salen todos de acá.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Serializa un objeto JSON-LD para meterlo en un <script> con
 * dangerouslySetInnerHTML. JSON.stringify NO escapa `<`: un título o una
 * descripción de curso con `</script><script>...` cerraba el tag y ejecutaba
 * JS en el navegador de cada visitante de la página pública del curso. `<`
 * es el mismo carácter para el parser JSON, pero el parser HTML ya no lo ve
 * como inicio de tag.
 */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, '\\u003c');
}
