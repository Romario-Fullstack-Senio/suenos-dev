import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CursoDetalleClient, Curso } from '@/components/CursoDetalleClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchCurso(slug: string): Promise<Curso | null> {
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

async function fetchResumenResenas(cursoId: string): Promise<{ promedio: number; total: number } | null> {
  try {
    const res = await fetch(`${API_URL}/cursos/${cursoId}/resenas`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const curso = await fetchCurso(params.slug);
  if (!curso) {
    return { title: 'Curso no encontrado' };
  }

  const descripcion = curso.descripcion.length > 155 ? `${curso.descripcion.slice(0, 155)}…` : curso.descripcion;

  return {
    title: curso.titulo,
    description: descripcion,
    alternates: { canonical: `/cursos/${curso.slug}` },
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

export default async function CursoDetallePage({ params }: { params: { slug: string } }) {
  const curso = await fetchCurso(params.slug);
  if (!curso) {
    notFound();
  }

  const resumenResenas = await fetchResumenResenas(curso.id);

  // Structured data (schema.org Course) — ayuda a que Google entienda que
  // esto es un curso vendible, no solo una página de texto genérica.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: curso.titulo,
    description: curso.descripcion,
    provider: {
      '@type': 'Organization',
      name: 'Sueños Dev',
      sameAs: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
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
      price: curso.precio,
      priceCurrency: 'USD',
      availability: curso.estado === 'publicado' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger -- JSON-LD estático generado por nosotros, no HTML de usuario */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CursoDetalleClient curso={curso} />
    </>
  );
}
