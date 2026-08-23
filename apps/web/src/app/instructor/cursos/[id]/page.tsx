'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { ModuloForm } from '@/components/forms/ModuloForm';
import { LeccionForm } from '@/components/forms/LeccionForm';
import Link from 'next/link';

interface Leccion {
  id: string;
  titulo: string;
  orden: number;
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
  estado: string;
  modulos: Modulo[];
}

export default function GestionarCursoPage() {
  const params = useParams();
  const cursoId = params.id as string;
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [moduloSeleccionado, setModuloSeleccionado] = useState<string | null>(null);

  const fetchCurso = async () => {
    try {
      const data = await apiGet<Curso>(`/cursos/${cursoId}`);
      setCurso(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurso();
  }, [cursoId]);

  const handlePublicar = async () => {
    try {
      await apiPost(`/cursos/${cursoId}/publicar`, {});
      alert('Curso publicado');
      fetchCurso();
    } catch (error) {
      alert('Error al publicar');
    }
  };

  if (loading) return <p className="text-center py-16">Cargando...</p>;
  if (!curso) return <p className="text-center py-16">Curso no encontrado</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{curso.titulo}</h1>
          <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${curso.estado === 'publicado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {curso.estado}
          </span>
        </div>
        {curso.estado === 'borrador' && (
          <button onClick={handlePublicar} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
            Publicar Curso
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Módulos</h2>
          <ModuloForm cursoId={cursoId} onModuloCreated={fetchCurso} />
          {curso.modulos.map((mod) => (
            <div
              key={mod.id}
              className={`bg-white rounded-xl p-4 shadow-sm border mb-3 cursor-pointer ${moduloSeleccionado === mod.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setModuloSeleccionado(mod.id)}
            >
              <div className="flex justify-between">
                <span className="font-medium">{mod.titulo}</span>
                <span className="text-gray-400 text-sm">#{mod.orden}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{mod.lecciones.length} lecciones</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Lecciones</h2>
          {moduloSeleccionado ? (
            <>
              <LeccionForm cursoId={cursoId} moduloId={moduloSeleccionado} onLeccionCreated={fetchCurso} />
              {curso.modulos.find(m => m.id === moduloSeleccionado)?.lecciones.map((lec) => (
                <div key={lec.id} className="bg-white rounded-xl p-4 shadow-sm border mb-3">
                  <span className="font-medium">{lec.titulo}</span>
                  <span className="text-gray-400 text-sm ml-2">#{lec.orden}</span>
                </div>
              ))}
            </>
          ) : (
            <p className="text-gray-500">Selecciona un módulo para ver sus lecciones</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link href={`/instructor/cursos/${cursoId}/quiz`} className="text-primary hover:underline">
          Gestionar Quiz del Curso
        </Link>
      </div>
    </div>
  );
}
