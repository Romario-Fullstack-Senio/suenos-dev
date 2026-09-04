'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiDelete } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Star } from 'lucide-react';

interface Resena {
  id: string;
  cursoId: string;
  cursoNombre: string;
  estudianteNombre: string;
  calificacion: number;
  comentario: string | null;
  createdAt: string;
}

export default function AdminResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [eliminando, setEliminando] = useState<string | null>(null);

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

  const filtradas = resenas.filter(
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
        className="w-full mb-6 px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

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
                </div>
                {r.comentario && <p className="text-sm text-ink-muted">{r.comentario}</p>}
                <p className="text-xs text-ink-soft mt-1">
                  {new Date(r.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => eliminar(r.id)}
                isLoading={eliminando === r.id}
                disabled={eliminando === r.id}
                className="flex-shrink-0 text-red-500"
              >
                Eliminar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
