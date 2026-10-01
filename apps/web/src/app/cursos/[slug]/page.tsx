import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CursoDetalleClient, Curso } from '@/components/CursoDetalleClient';
import { SERVER_API_URL as API_URL } from '@/lib/api';
import { SITE_URL, serializarJsonLd } from '@/lib/seo';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchCursoPorSlug(slug: string): Promise<Curso | null> {
  try {
    const res = await fetch(`${API_URL}/cursos/slug/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !('id' in data)) return null;
    return data as Curso;
  } catch {
    return null;
  }
}

async function fetchCursoPorId(id: string): Promise<Curso | null> {
  try {
    const res = await fetch(`${API_URL}/cursos/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    // findOne() del controller no tira 404: devuelve {message: '...'} (sin
    // "id") cuando no encuentra el curso.
    if (!data || !('id' in data) || !('slug' in data)) return null;
    return data as Curso;
  } catch {
    return null;
  }
}

// El link de "curso nuevo" en las notificaciones (NotificationBell) manda al
// cursoId (uuid), no al slug — esta ruta solo entiende slugs. Antes de este
// fallback, tocar esa notificación daba 404 siempre. En vez de duplicar la
// lógica en el frontend, si el segmento de la URL es un uuid se resuelve acá
// contra /cursos/:id y se redirige a la URL canónica con el slug real.
async function fetchCurso(slugOId: string): Promise<Curso | null> {
  const porSlug = await fetchCursoPorSlug(slugOId);
  if (porSlug) return porSlug;
  if (UUID_RE.test(slugOId)) {
    return fetchCursoPorId(slugOId);
  }
  return null;
}

async function fetchResumenResenas(cursoId: string): Promise<{ promedio: number; total: number } | null> {
  try {
    const res = await fetch(`${API_URL}/cursos/${cursoId}/resenas`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Next 16: `params` es una Promise (se eliminó el acceso síncrono).
type Props = Readonly<{ params: Promise<{ slug: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const curso = await fetchCurso(slug);
  if (!curso) {
    return { title: 'Curso no encontrado' };
  }

  const descripcion = curso.descripcion.length > 155 ? `${curso.descripcion.slice(0, 155)}…` : curso.descripcion;

  return {
    title: curso.titulo,
    description: descripcion,
    alternates: { canonical: `/cursos/${curso.slug}` },
    // Un borrador/archivado accesible por URL no debe terminar en Google.
    ...(curso.estado !== 'publicado' && { robots: { index: false, follow: true } }),
    openGraph: {
      title: curso.titulo,
      description: descripcion,
      type: 'website',
      images: curso.imagenUrl ? [{ url: curso.imagenUrl }] : undefined,
    },
    twitter: {
      title: curso.titulo,
      description: descripcion,
      images: curso.imagenUrl ? [curso.imagenUrl] : undefined,
    },
  };
}

export default async function CursoDetallePage({ params }: Props) {
  const { slug } = await params;
  const curso = await fetchCurso(slug);
  if (!curso) {
    notFound();
  }
  // Se llegó acá por el cursoId (uuid) de una notificación, no por el slug
  // real — redirige a la URL canónica para que el link quede bien la
  // próxima vez (favoritos, historial del navegador, compartir, etc.).
  if (slug !== curso.slug) {
    redirect(`/cursos/${curso.slug}`);
  }

  const resumenResenas = await fetchResumenResenas(curso.id);

  // Structured data (schema.org Course) — ayuda a que Google entienda que
  // esto es un curso vendible, no solo una página de texto genérica.
  const urlCurso = `${SITE_URL}/cursos/${curso.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: curso.titulo,
    description: curso.descripcion,
    url: urlCurso,
    inLanguage: 'es',
    ...(curso.imagenUrl && { image: curso.imagenUrl }),
    provider: {
      '@type': 'Organization',
      name: 'Sueños Dev',
      sameAs: SITE_URL,
    },
    ...(curso.instructorNombre && {
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        instructor: { '@type': 'Person', name: curso.instructorNombre },
      },
    }),
    ...(resumenResenas && resumenResenas.total > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: resumenResenas.promedio,
        reviewCount: resumenResenas.total,
      },
    }),
    offers: {
      '@type': 'Offer',
      url: urlCurso,
      category: curso.precio === 0 ? 'Free' : 'Paid',
      price: curso.precio,
      priceCurrency: 'USD',
      availability: curso.estado === 'publicado' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      {/* Título y descripción los escribe el instructor: serializarJsonLd
          escapa `<` para que no puedan cerrar el <script> (XSS almacenado). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(jsonLd) }} />
      <CursoDetalleClient curso={curso} />
    </>
  );
}
