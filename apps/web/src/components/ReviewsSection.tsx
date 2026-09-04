'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

interface Resena {
  id: string;
  estudianteNombre: string;
  calificacion: number;
  comentario: string | null;
  createdAt: string;
}

interface ResumenResenas {
  promedio: number;
  total: number;
  resenas: Resena[];
}

function Estrellas({ valor, size = 16 }: { valor: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(valor) ? 'fill-accent text-accent' : 'text-ink/[0.15]'}
        />
      ))}
    </div>
  );
}

export function ReviewsSection({ cursoId }: { cursoId: string }) {
  const { isAuthenticated } = useAuth();
  const [resumen, setResumen] = useState<ResumenResenas | null>(null);
  const [loading, setLoading] = useState(true);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<ResumenResenas>(`/cursos/${cursoId}/resenas`);
      setResumen(data);
    } catch {
      // no romper la página de curso si esto falla
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviarResena = async () => {
    if (calificacion === 0) {
      toast.error('Elegí una calificación de 1 a 5 estrellas');
      return;
    }
    setEnviando(true);
    try {
      await apiPost(`/cursos/${cursoId}/resenas`, { calificacion, comentario: comentario || undefined });
      toast.success('¡Gracias por tu reseña!');
      setMostrarForm(false);
      setCalificacion(0);
      setComentario('');
      cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar la reseña');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-ink">Reseñas</h2>
        {resumen && resumen.total > 0 && (
          <div className="flex items-center gap-2">
            <Estrellas valor={resumen.promedio} />
            <span className="text-ink-muted text-sm">
              {resumen.promedio.toFixed(1)} · {resumen.total} {resumen.total === 1 ? 'reseña' : 'reseñas'}
            </span>
          </div>
        )}
      </div>

      {isAuthenticated && !mostrarForm && (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="text-sm text-secondary hover:underline mb-6"
        >
          Dejar una reseña
        </button>
      )}

      {mostrarForm && (
        <div className="card mb-6">
          <p className="text-sm font-semibold text-ink-muted mb-2">Tu calificación</p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setCalificacion(n)} aria-label={`${n} estrellas`}>
                <Star size={28} className={n <= calificacion ? 'fill-accent text-accent' : 'text-ink/[0.15]'} />
              </button>
            ))}
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="¿Qué te pareció el curso? (opcional)"
            rows={3}
            className="w-full px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3"
          />
          <div className="flex gap-2">
            <Button onClick={enviarResena} isLoading={enviando} disabled={enviando}>
              Publicar reseña
            </Button>
            <Button variant="ghost" onClick={() => setMostrarForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!resumen || resumen.total === 0 ? (
        <p className="text-ink-muted text-sm">Todavía no hay reseñas para este curso.</p>
      ) : (
        <div className="space-y-4">
          {resumen.resenas.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-ink">{r.estudianteNombre}</span>
                <Estrellas valor={r.calificacion} size={14} />
              </div>
              {r.comentario && <p className="text-ink-muted text-sm">{r.comentario}</p>}
              <p className="text-ink-soft text-xs mt-2">
                {new Date(r.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
