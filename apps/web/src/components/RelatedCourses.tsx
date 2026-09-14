'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { CourseCard } from '@/components/CourseCard';

interface CursoResumen {
  id: string;
  titulo: string;
  slug: string;
  precio: number;
  imagenUrl?: string;
  categoria?: string;
  nivel?: string;
  instructorNombre?: string;
  esOficial?: boolean;
  esNuevo?: boolean;
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
          <CourseCard key={curso.id} curso={curso} />
        ))}
      </div>
    </div>
  );
}
