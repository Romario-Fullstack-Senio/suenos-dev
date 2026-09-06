'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiDelete, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Flag, EyeOff } from 'lucide-react';

interface Pregunta {
  id: string;
  cursoId: string;
  leccionId: string;
  autorNombre: string;
  texto: string;
  totalReportes: number;
  oculta: boolean;
  createdAt: string;
}

// Solo preguntas de Q&A con al menos un reporte — a diferencia de "Moderar
// Reseñas", acá no tiene sentido listar TODO el Q&A de la plataforma (sería
// enorme y en su mayoría sin nada que moderar).
export default function AdminPreguntasReportadasPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [restaurando, setRestaurando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Pregunta[]>('/preguntas/reportadas');
      setPreguntas(data);
    } catch {
      toast.error('Error al cargar las preguntas reportadas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta? No se puede deshacer.')) return;
    setEliminando(id);
    try {
      await apiDelete(`/preguntas/${id}`);
      toast.success('Pregunta eliminada');
      setPreguntas((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  const restaurar = async (id: string) => {
    setRestaurando(id);
    try {
      await apiPost(`/preguntas/${id}/restaurar`, {});
      toast.success('Pregunta restaurada');
      setPreguntas((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al restaurar');
    } finally {
      setRestaurando(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-ink">Preguntas reportadas</h1>
      <p className="text-sm text-ink-muted mb-6">Preguntas de Q&amp;A con al menos un reporte de un estudiante.</p>

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : preguntas.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">No hay preguntas reportadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {preguntas.map((p) => (
            <div key={p.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-ink">{p.autorNombre}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    <Flag className="w-3 h-3" /> {p.totalReportes} {p.totalReportes === 1 ? 'reporte' : 'reportes'}
                  </span>
                  {p.oculta && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                      <EyeOff className="w-3 h-3" /> Oculta
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-muted whitespace-pre-wrap break-words">{p.texto}</p>
                <p className="text-xs text-ink-soft mt-1">
                  {new Date(p.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => restaurar(p.id)} isLoading={restaurando === p.id} disabled={restaurando === p.id}>
                  Restaurar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => eliminar(p.id)} isLoading={eliminando === p.id} disabled={eliminando === p.id} className="text-red-500">
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
