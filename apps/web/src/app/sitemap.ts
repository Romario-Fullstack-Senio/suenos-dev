import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ListadoCursos {
  cursos: { slug: string }[];
}

async function fetchSlugsDeCursos(): Promise<string[]> {
  try {
    // limit=100: el tope que acepta el endpoint — de sobra para meter todos
    // los cursos publicados de una sola pasada en el sitemap.
    const res = await fetch(`${API_URL}/cursos?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: ListadoCursos = await res.json();
    return data.cursos.map(c => c.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchSlugsDeCursos();

  const rutasEstaticas: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/cursos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/auth/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/auth/registro`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const rutasDeCursos: MetadataRoute.Sitemap = slugs.map(slug => ({
    url: `${siteUrl}/cursos/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...rutasEstaticas, ...rutasDeCursos];
}
