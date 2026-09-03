'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';

interface Curso {
  id: string;
  titulo: string;
  slug: string;
  estado: string;
  precio: number;
  instructorId: string;
}

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCursos = async () => {
    try {
      const data = await apiGet<Curso[]>('/cursos/admin/todos');
      setCursos(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const handleToggleEstado = async (cursoId: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'publicado' ? 'borrador' : 'publicado';
    try {
      await apiPut(`/cursos/${cursoId}/estado`, { estado: nuevoEstado });
      fetchCursos();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestionar Cursos</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="bg-cloud-100 rounded-xl shadow-sm border border-ink/[0.07] overflow-hidden">
          <table className="w-full">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Título</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Precio</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.07] border-ink/[0.07]">
              {cursos.map((curso) => (
                <tr key={curso.id}>
                  <td className="px-6 py-4 font-medium">{curso.titulo}</td>
                  <td className="px-6 py-4">${curso.precio}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${curso.estado === 'publicado' ? 'bg-green-500/15 text-green-400' : 'bg-accent/15 text-accent'}`}>
                      {curso.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleEstado(curso.id, curso.estado)}
                      className="text-secondary text-sm hover:underline"
                    >
                      {curso.estado === 'publicado' ? 'Despublicar' : 'Publicar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
