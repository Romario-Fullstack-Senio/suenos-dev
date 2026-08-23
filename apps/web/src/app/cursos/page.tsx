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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Cursos Disponibles</h1>

      {loading ? (
        <p>Cargando cursos...</p>
      ) : cursos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-600">No hay cursos disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <Link key={curso.id} href={`/cursos/${curso.slug}`}>
              <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition cursor-pointer h-full">
                <h3 className="font-semibold text-lg mb-2">{curso.titulo}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{curso.descripcion}</p>
                <p className="text-primary font-bold">${curso.precio} USD</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
