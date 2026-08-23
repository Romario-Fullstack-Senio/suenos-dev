'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface Leccion {
  id: string;
  titulo: string;
  orden: number;
  duracionSegundos: number;
  videoUrl?: string;
}

interface Modulo {
  id: string;
  titulo: string;
  orden: number;
  lecciones: Leccion[];
}

interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  slug: string;
  precio: number;
  estado: string;
  instructorId: string;
  modulos: Modulo[];
}

export default function CursoDetallePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        const data = await apiGet<Curso>(`/cursos/slug/${slug}`);
        if (data && 'id' in data) {
          setCurso(data);
        } else {
          setError('Curso no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el curso');
      } finally {
        setLoading(false);
      }
    };
    fetchCurso();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p>Cargando curso...</p>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-red-600">{error || 'Curso no encontrado'}</p>
        <Link href="/cursos" className="text-primary hover:underline mt-4 block">
          Volver a cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/cursos" className="text-primary hover:underline mb-4 block">
        &larr; Volver a cursos
      </Link>

      <div className="bg-white rounded-xl p-8 shadow-sm border mb-8">
        <h1 className="text-3xl font-bold mb-4">{curso.titulo}</h1>
        <p className="text-gray-600 mb-6">{curso.descripcion}</p>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-2xl font-bold text-primary">${curso.precio} USD</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            curso.estado === 'publicado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {curso.estado}
          </span>
        </div>
        <Link
          href={`/checkout?cursoId=${curso.id}`}
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
        >
          Comprar Curso
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-6">Contenido del Curso</h2>
      <div className="space-y-4">
        {curso.modulos.map((modulo) => (
          <div key={modulo.id} className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="font-semibold text-lg mb-4">
              Módulo {modulo.orden}: {modulo.titulo}
            </h3>
            <ul className="space-y-2">
              {modulo.lecciones.map((leccion) => (
                <li key={leccion.id} className="flex items-center gap-3 text-gray-700">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                    {leccion.orden}
                  </span>
                  <span>{leccion.titulo}</span>
                  <span className="text-gray-400 text-sm ml-auto">
                    {Math.floor(leccion.duracionSegundos / 60)}:{String(leccion.duracionSegundos % 60).padStart(2, '0')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
