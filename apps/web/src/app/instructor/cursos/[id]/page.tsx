'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api';
import { ModuloForm } from '@/components/forms/ModuloForm';
import { LeccionForm } from '@/components/forms/LeccionForm';
import { SubtitulosUpload } from '@/components/forms/SubtitulosUpload';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';

interface Leccion {
  id: string;
  titulo: string;
  orden: number;
  videoUrl?: string;
  subtitulosUrl?: string;
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
  precio: number;
  estado: string;
  modulos: Modulo[];
}

export default function GestionarCursoPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id as string;
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [moduloSeleccionado, setModuloSeleccionado] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const fetchCurso = async () => {
    try {
      const data = await apiGet<Curso>(`/cursos/${cursoId}`);
      setCurso(data);
      setEditTitulo(data.titulo);
      setEditDescripcion(data.descripcion);
      setEditPrecio(String(data.precio));
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
      toast.success('Curso publicado');
      fetchCurso();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al publicar');
    }
  };

  const handleDespublicar = async () => {
    try {
      await apiPut(`/cursos/${cursoId}/estado`, { estado: 'borrador' });
      toast.success('Curso vuelto a borrador');
      fetchCurso();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al despublicar');
    }
  };

  const handleGuardarEdicion = async () => {
    setGuardando(true);
    try {
      await apiPatch(`/cursos/${cursoId}`, {
        titulo: editTitulo,
        descripcion: editDescripcion,
        precio: Number(editPrecio),
      });
      toast.success('Curso actualizado');
      setEditando(false);
      fetchCurso();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el curso');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm('¿Eliminar este curso? Se borrarán también sus módulos y lecciones. Esta acción no se puede deshacer.')) {
      return;
    }
    setEliminando(true);
    try {
      await apiDelete(`/cursos/${cursoId}`);
      toast.success('Curso eliminado');
      router.push('/instructor');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el curso');
      setEliminando(false);
    }
  };

  if (loading) return <p className="text-center py-16">Cargando...</p>;
  if (!curso) return <p className="text-center py-16">Curso no encontrado</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8 gap-4">
        <div className="flex-1">
          {editando ? (
            <div className="max-w-lg">
              <Input label="Título" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
              <TextArea label="Descripción" rows={3} value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
              <Input label="Precio (USD)" type="number" step="0.01" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} />
              <div className="flex gap-2 mt-2">
                <Button onClick={handleGuardarEdicion} isLoading={guardando} disabled={guardando}>
                  Guardar cambios
                </Button>
                <Button variant="ghost" onClick={() => setEditando(false)} disabled={guardando}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{curso.titulo}</h1>
                <button
                  onClick={() => setEditando(true)}
                  className="text-ink-soft hover:text-primary transition-colors"
                  aria-label="Editar curso"
                  title="Editar curso"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${curso.estado === 'publicado' ? 'bg-green-500/15 text-green-400' : 'bg-accent/15 text-accent'}`}>
                {curso.estado}
              </span>
            </>
          )}
        </div>

        {!editando && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {curso.estado === 'borrador' ? (
              <button onClick={handlePublicar} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-semibold">
                Publicar Curso
              </button>
            ) : (
              <button onClick={handleDespublicar} className="bg-cloud-50 border border-ink/[0.12] text-ink px-4 py-2 rounded-lg hover:bg-cloud-100 text-sm font-semibold">
                Volver a borrador
              </button>
            )}
            <button
              onClick={handleEliminar}
              disabled={eliminando}
              className="text-ink-soft hover:text-red-500 transition-colors p-2 disabled:opacity-50"
              aria-label="Eliminar curso"
              title="Eliminar curso"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Módulos</h2>
          <ModuloForm cursoId={cursoId} onModuloCreated={fetchCurso} />
          {curso.modulos.map((mod) => (
            <div
              key={mod.id}
              className={`bg-cloud-100 rounded-xl p-4 shadow-sm border border-ink/[0.07] mb-3 cursor-pointer ${moduloSeleccionado === mod.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setModuloSeleccionado(mod.id)}
            >
              <div className="flex justify-between">
                <span className="font-medium">{mod.titulo}</span>
                <span className="text-ink-soft text-sm">#{mod.orden}</span>
              </div>
              <p className="text-sm text-ink-muted mt-1">{mod.lecciones.length} lecciones</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Lecciones</h2>
          {moduloSeleccionado ? (
            <>
              <LeccionForm cursoId={cursoId} moduloId={moduloSeleccionado} onLeccionCreated={fetchCurso} />
              {curso.modulos.find(m => m.id === moduloSeleccionado)?.lecciones.map((lec) => (
                <div key={lec.id} className="bg-cloud-100 rounded-xl p-4 shadow-sm border border-ink/[0.07] mb-3">
                  <div>
                    <span className="font-medium">{lec.titulo}</span>
                    <span className="text-ink-soft text-sm ml-2">#{lec.orden}</span>
                  </div>
                  {lec.videoUrl && (
                    <div className="mt-2">
                      <SubtitulosUpload
                        leccionId={lec.id}
                        tieneSubtitulos={!!lec.subtitulosUrl}
                        onUploaded={fetchCurso}
                      />
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <p className="text-ink-muted">Selecciona un módulo para ver sus lecciones</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link href={`/instructor/cursos/${cursoId}/quiz`} className="text-secondary hover:underline">
          Gestionar Quiz del Curso
        </Link>
      </div>
    </div>
  );
}
