'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { formatearPrecio } from '@/lib/format';

interface CursoResumen {
  id: string;
  titulo: string;
  slug: string;
  precio: number;
  imagenUrl?: string;
}

export function RelatedCourses({ cursoId }: { cursoId: string }) {
  const [relacionados, setRelacionados] = useState<CursoResumen[]>([]);

  useEffect(() => {
    apiGet<CursoResumen[]>(`/cursos/${cursoId}/relacionados`)
      .then(setRelacionados)
      .catch(() => {});
  }, [cursoId]);

  if (relacionados.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-ink">Cursos relacionados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {relacionados.map((curso) => (
          <article key={curso.id} className="card card-hover overflow-hidden p-0 h-full flex flex-col relative">
            <CourseCoverImage imagenUrl={curso.imagenUrl} titulo={curso.titulo} className="w-full aspect-video" />
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold mb-1 line-clamp-2">
                <Link
                  href={`/cursos/${curso.slug}`}
                  className="text-ink hover:text-primary before:absolute before:inset-0 before:content-['']"
                >
                  {curso.titulo}
                </Link>
              </h3>
              <p className="font-extrabold text-ink mt-auto">{formatearPrecio(curso.precio)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
