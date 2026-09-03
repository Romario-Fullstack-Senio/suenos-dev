'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { CourseCoverImage } from '@/components/CourseCoverImage';

interface CursoResumen {
  id: string;
  titulo: string;
  slug: string;
  precio: number;
  imagenUrl?: string;
}

interface ListadoCursos {
  cursos: CursoResumen[];
}

export function RelatedCourses({ cursoId, categoria }: { cursoId: string; categoria?: string }) {
  const [relacionados, setRelacionados] = useState<CursoResumen[]>([]);

  useEffect(() => {
    if (!categoria) return;
    apiGet<ListadoCursos>(`/cursos?categoria=${encodeURIComponent(categoria)}&limit=5`)
      .then(data => setRelacionados((data.cursos ?? []).filter(c => c.id !== cursoId).slice(0, 4)))
      .catch(() => {});
  }, [cursoId, categoria]);

  if (relacionados.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-ink">Cursos relacionados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {relacionados.map((curso) => (
          <Link key={curso.id} href={`/cursos/${curso.slug}`}>
            <div className="card overflow-hidden p-0 cursor-pointer h-full flex flex-col">
              <CourseCoverImage imagenUrl={curso.imagenUrl} titulo={curso.titulo} className="w-full aspect-video" />
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-ink mb-1 line-clamp-2">{curso.titulo}</h3>
                <p className="text-accent font-bold mt-auto">${curso.precio} USD</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
