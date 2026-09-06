'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiDelete, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Star, Flag, EyeOff } from 'lucide-react';

interface Resena {
  id: string;
  cursoId: string;
  cursoNombre: string;
  estudianteNombre: string;
  calificacion: number;
  comentario: string | null;
  createdAt: string;
  totalReportes: number;
  oculta: boolean;
}

export default function AdminResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [restaurando, setRestaurando] = useState<string | null>(null);
  const [soloReportadas, setSoloReportadas] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Resena[]>('/resenas');
      setResenas(data);
    } catch (error) {
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña? No se puede deshacer.')) return;
    setEliminando(id);
    try {
      await apiDelete(`/resenas/${id}`);
      toast.success('Reseña eliminada');
      setResenas((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  const restaurar = async (id: string) => {
    setRestaurando(id);
    try {
      await apiPost(`/resenas/${id}/restaurar`, {});
      toast.success('Reseña restaurada');
      setResenas((prev) => prev.map((r) => (r.id === id ? { ...r, oculta: false, totalReportes: 0 } : r)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al restaurar');
    } finally {
      setRestaurando(null);
    }
  };

  const filtradas = resenas
    .filter((r) => !soloReportadas || r.totalReportes > 0)
    .filter(
      (r) =>
        !busqueda ||
        r.estudianteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.cursoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.comentario ?? '').toLowerCase().includes(busqueda.toLowerCase()),
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-ink">Moderar Reseñas</h1>

      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por alumno, curso o texto del comentario..."
        className="w-full mb-3 px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <label className="flex items-center gap-2 mb-6 text-sm text-ink-muted cursor-pointer w-fit">
        <input type="checkbox" checked={soloReportadas} onChange={(e) => setSoloReportadas(e.target.checked)} className="rounded border-ink/[0.2]" />
        Mostrar solo reseñas reportadas
      </label>

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">No hay reseñas que coincidan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((r) => (
            <div key={r.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-ink">{r.estudianteNombre}</span>
                  <span className="text-ink-soft text-sm">sobre</span>
                  <span className="text-sm text-primary">{r.cursoNombre}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs text-accent">
                    <Star className="w-3 h-3 fill-current" /> {r.calificacion}/5
                  </span>
                  {r.totalReportes > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      <Flag className="w-3 h-3" /> {r.totalReportes} {r.totalReportes === 1 ? 'reporte' : 'reportes'}
                    </span>
                  )}
                  {r.oculta && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                      <EyeOff className="w-3 h-3" /> Oculta
                    </span>
                  )}
                </div>
                {r.comentario && <p className="text-sm text-ink-muted">{r.comentario}</p>}
                <p className="text-xs text-ink-soft mt-1">
                  {new Date(r.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {r.oculta && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restaurar(r.id)}
                    isLoading={restaurando === r.id}
                    disabled={restaurando === r.id}
                  >
                    Restaurar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminar(r.id)}
                  isLoading={eliminando === r.id}
                  disabled={eliminando === r.id}
                  className="text-red-500"
                >
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
