import type { MetadataRoute } from 'next';
import { SERVER_API_URL } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';

interface ListadoCursos {
  cursos: { slug: string }[];
}

// Generado por request (con el fetch cacheado 1h): prerenderizado en el build
// de la imagen Docker, el API no responde y el sitemap salía sin ningún curso.
export const dynamic = 'force-dynamic';

async function fetchSlugsDeCursos(): Promise<string[]> {
  try {
    // limit=100: el tope que acepta el endpoint — de sobra para meter todos
    // los cursos publicados de una sola pasada en el sitemap.
    const res = await fetch(`${SERVER_API_URL}/cursos?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: ListadoCursos = await res.json();
    return data.cursos.map(c => c.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchSlugsDeCursos();

  // Solo páginas indexables: login/registro no aportan nada en buscadores
  // (y están bajo noindex, ver app/auth/layout.tsx).
  const rutasEstaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/cursos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/paquetes`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/comunidad`, changeFrequency: 'daily', priority: 0.5 },
    { url: `${SITE_URL}/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const rutasDeCursos: MetadataRoute.Sitemap = slugs.map(slug => ({
    url: `${SITE_URL}/cursos/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...rutasEstaticas, ...rutasDeCursos];
}
