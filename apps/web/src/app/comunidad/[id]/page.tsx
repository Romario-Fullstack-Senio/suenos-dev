'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Pin, Lock, Flag, Trash2, EyeOff } from 'lucide-react';

interface Respuesta {
  id: string;
  autorId: string;
  autorNombre: string;
  autorEsAdmin: boolean;
  texto: string;
  createdAt: string;
}

interface Tema {
  id: string;
  autorId: string;
  autorNombre: string;
  titulo: string;
  texto: string;
  categoria: string;
  fijado: boolean;
  cerrado: boolean;
  createdAt: string;
  totalReportes: number;
  oculta: boolean;
  respuestas: Respuesta[];
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TemaForoPage() {
  const params = useParams();
  const router = useRouter();
  const temaId = params.id as string;
  const { user } = useAuth();
  const [tema, setTema] = useState<Tema | null>(null);
  const [loading, setLoading] = useState(true);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [reportado, setReportado] = useState(false);

  const esAdmin = user?.rol === 'admin';

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Tema>(`/foro/temas/${temaId}`);
      setTema(data);
    } catch {
      setTema(null);
    } finally {
      setLoading(false);
    }
  }, [temaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const responder = async () => {
    if (!respuesta.trim()) return;
    setEnviando(true);
    try {
      await apiPost(`/foro/temas/${temaId}/respuestas`, { texto: respuesta.trim() });
      setRespuesta('');
      toast.success('Respuesta publicada');
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar la respuesta');
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async () => {
    if (!confirm('¿Eliminar este tema? No se puede deshacer.')) return;
    try {
      await apiDelete(`/foro/temas/${temaId}`);
      toast.success('Tema eliminado');
      router.push('/comunidad');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar');
    }
  };

  const reportar = async () => {
    try {
      const res = await apiPost<{ message: string }>(`/foro/temas/${temaId}/reportar`, {});
      toast.success(res.message);
      setReportado(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo reportar');
    }
  };

  const toggleFijado = async () => {
    if (!tema) return;
    try {
      await apiPatch(`/foro/temas/${temaId}/fijar`, { fijado: !tema.fijado });
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar');
    }
  };

  const toggleCerrado = async () => {
    if (!tema) return;
    try {
      await apiPatch(`/foro/temas/${temaId}/cerrar`, { cerrado: !tema.cerrado });
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar');
    }
  };

  const restaurar = async () => {
    try {
      await apiPost(`/foro/temas/${temaId}/restaurar`, {});
      toast.success('Tema restaurado');
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo restaurar');
    }
  };

  if (loading) return <p className="text-center py-16 text-ink-muted">Cargando...</p>;
  if (!tema) return <p className="text-center py-16 text-ink-muted">Tema no encontrado</p>;

  const puedeEliminar = user && (user.id === tema.autorId || esAdmin);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {tema.fijado && <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded"><Pin className="w-3 h-3" /> Fijado</span>}
          {tema.cerrado && <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-soft bg-ink/[0.06] px-1.5 py-0.5 rounded"><Lock className="w-3 h-3" /> Cerrado</span>}
          {tema.oculta && <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded"><EyeOff className="w-3 h-3" /> Oculto</span>}
          <span className="text-xs text-ink-soft capitalize">{tema.categoria}</span>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">{tema.titulo}</h1>
        <p className="text-sm text-ink-muted whitespace-pre-wrap break-words mb-3">{tema.texto}</p>
        <p className="text-xs text-ink-soft">{tema.autorNombre} · {formatFecha(tema.createdAt)}</p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ink/[0.06]">
          {puedeEliminar && (
            <button onClick={eliminar} className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:underline">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          )}
          {user && user.id !== tema.autorId && !esAdmin && (
            <button onClick={reportar} disabled={reportado} className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-red-500 hover:underline disabled:opacity-50">
              <Flag className="w-3.5 h-3.5" /> {reportado ? 'Reportado' : 'Reportar'}
            </button>
          )}
          {esAdmin && (
            <>
              <button onClick={toggleFijado} className="text-xs font-medium text-primary hover:underline">
                {tema.fijado ? 'Desfijar' : 'Fijar'}
              </button>
              <button onClick={toggleCerrado} className="text-xs font-medium text-primary hover:underline">
                {tema.cerrado ? 'Reabrir' : 'Cerrar tema'}
              </button>
              {tema.oculta && (
                <button onClick={restaurar} className="text-xs font-medium text-green-600 hover:underline">
                  Restaurar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4 text-ink">
        Respuestas {tema.respuestas.length > 0 && <span className="text-ink-muted font-normal">({tema.respuestas.length})</span>}
      </h2>

      <div className="space-y-4 mb-6">
        {tema.respuestas.map((r) => (
          <div key={r.id} className="bg-cloud-100 rounded-xl p-4 shadow-sm border border-ink/[0.07]">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-medium text-ink">{r.autorNombre}</span>
              {r.autorEsAdmin && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">Equipo</span>
              )}
              <span className="text-xs text-ink-soft">{formatFecha(r.createdAt)}</span>
            </div>
            <p className="text-sm text-ink-muted whitespace-pre-wrap break-words">{r.texto}</p>
          </div>
        ))}
        {tema.respuestas.length === 0 && (
          <p className="text-sm text-ink-soft">Todavía no hay respuestas. ¡Sé el primero!</p>
        )}
      </div>

      {user ? (
        tema.cerrado && !esAdmin ? (
          <p className="text-sm text-ink-soft">Este tema está cerrado y ya no admite respuestas nuevas.</p>
        ) : (
          <div className="bg-cloud-100 rounded-xl p-4 shadow-sm border border-ink/[0.07]">
            <textarea
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Escribí tu respuesta..."
              className="w-full px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-3"
            />
            <Button onClick={responder} isLoading={enviando} disabled={enviando || !respuesta.trim()}>
              Responder
            </Button>
          </div>
        )
      ) : (
        <p className="text-sm text-ink-muted">Iniciá sesión para responder.</p>
      )}
    </div>
  );
}
