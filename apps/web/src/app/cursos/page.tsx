'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface Curso {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  precio: number;
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const data = await apiGet<Curso[]>('/cursos');
        setCursos(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCursos();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <h1 className="font-display text-3xl font-bold mb-8 text-suenos-text">Cursos Disponibles</h1>

      {loading ? (
        <p className="text-suenos-muted">Cargando cursos...</p>
      ) : cursos.length === 0 ? (
        <div className="text-center py-16 card-suenos">
          <p className="text-suenos-muted">No hay cursos disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <Link key={curso.id} href={`/cursos/${curso.slug}`}>
              <div className="card-suenos p-6 cursor-pointer h-full">
                <h3 className="font-display font-semibold text-lg mb-2 text-suenos-text">{curso.titulo}</h3>
                <p className="text-suenos-muted text-sm mb-4 line-clamp-2">{curso.descripcion}</p>
                <p className="text-suenos-gold font-bold">${curso.precio} USD</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
