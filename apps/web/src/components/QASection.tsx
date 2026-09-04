'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageCircle, CheckCircle2, Trash2, Send } from 'lucide-react';

interface Respuesta {
  id: string;
  autorId: string;
  autorNombre: string;
  autorEsInstructor: boolean;
  texto: string;
  createdAt: string;
}

interface Pregunta {
  id: string;
  autorId: string;
  autorNombre: string;
  autorEsInstructor: boolean;
  texto: string;
  resuelta: boolean;
  createdAt: string;
  respuestas: Respuesta[];
}

function formatFecha(iso: string): string {
  const fecha = new Date(iso);
  return fecha.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Avatar({ nombre, esInstructor }: { nombre: string; esInstructor: boolean }) {
  const inicial = nombre?.charAt(0)?.toUpperCase() || '?';
  return (
    <div
      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
        esInstructor ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-cloud-300 text-ink'
      }`}
    >
      {inicial}
    </div>
  );
}

export default function QASection({ leccionId, puedeModerar }: { leccionId: string; puedeModerar: boolean }) {
  const { user } = useAuth();
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [enviandoPregunta, setEnviandoPregunta] = useState(false);
  const [respondiendoId, setRespondiendoId] = useState<string | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  const fetchPreguntas = useCallback(async () => {
    try {
      const data = await apiGet<Pregunta[]>(`/lecciones/${leccionId}/preguntas`);
      setPreguntas(data);
    } catch {
      // Silencioso: por ejemplo, todavía no tiene acceso a esta lección.
      setPreguntas([]);
    } finally {
      setLoading(false);
    }
  }, [leccionId]);

  useEffect(() => {
    setLoading(true);
    fetchPreguntas();
  }, [fetchPreguntas]);

  async function enviarPregunta() {
    if (!nuevaPregunta.trim() || !user) return;
    setEnviandoPregunta(true);
    try {
      await apiPost(`/lecciones/${leccionId}/preguntas`, { texto: nuevaPregunta.trim() });
      setNuevaPregunta('');
      toast.success('Pregunta publicada');
      await fetchPreguntas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar la pregunta');
    } finally {
      setEnviandoPregunta(false);
    }
  }

  async function enviarRespuesta(preguntaId: string) {
    if (!textoRespuesta.trim()) return;
    setEnviandoRespuesta(true);
    try {
      await apiPost(`/preguntas/${preguntaId}/respuestas`, { texto: textoRespuesta.trim() });
      setTextoRespuesta('');
      setRespondiendoId(null);
      toast.success('Respuesta publicada');
      await fetchPreguntas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar la respuesta');
    } finally {
      setEnviandoRespuesta(false);
    }
  }

  async function eliminarPregunta(id: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    try {
      await apiDelete(`/preguntas/${id}`);
      toast.success('Pregunta eliminada');
      setPreguntas((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar');
    }
  }

  async function marcarResuelta(id: string) {
    try {
      await apiPatch(`/preguntas/${id}/resolver`, {});
      toast.success('Marcada como resuelta');
      setPreguntas((prev) => prev.map((p) => (p.id === id ? { ...p, resuelta: true } : p)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar');
    }
  }

  return (
    <div className="mt-10 bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-ink">
          Preguntas y respuestas {preguntas.length > 0 && <span className="text-ink-muted font-normal">({preguntas.length})</span>}
        </h2>
      </div>

      {user ? (
        <div className="mb-6 flex gap-3">
          <Avatar nombre={user.nombre} esInstructor={puedeModerar} />
          <div className="flex-1">
            <textarea
              value={nuevaPregunta}
              onChange={(e) => setNuevaPregunta(e.target.value)}
              placeholder="¿Tenés una duda sobre esta lección? Preguntá acá..."
              rows={2}
              maxLength={2000}
              className="w-full rounded-lg border border-ink/10 bg-cloud-50 px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={enviarPregunta}
                disabled={!nuevaPregunta.trim() || enviandoPregunta}
                className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {enviandoPregunta ? 'Publicando...' : 'Preguntar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-muted mb-6">Iniciá sesión para preguntar o ver las respuestas del instructor.</p>
      )}

      {loading ? (
        <p className="text-sm text-ink-soft">Cargando preguntas...</p>
      ) : preguntas.length === 0 ? (
        <p className="text-sm text-ink-soft">Todavía no hay preguntas en esta lección. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-5">
          {preguntas.map((p) => (
            <div key={p.id} className="border-t border-ink/[0.06] pt-5 first:border-t-0 first:pt-0">
              <div className="flex gap-3">
                <Avatar nombre={p.autorNombre} esInstructor={p.autorEsInstructor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">{p.autorNombre}</span>
                    {p.autorEsInstructor && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Instructor
                      </span>
                    )}
                    {p.resuelta && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Resuelta
                      </span>
                    )}
                    <span className="text-xs text-ink-soft">{formatFecha(p.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink-muted mt-1 whitespace-pre-wrap break-words">{p.texto}</p>

                  <div className="flex items-center gap-4 mt-2">
                    {user && (
                      <button
                        onClick={() => { setRespondiendoId(respondiendoId === p.id ? null : p.id); setTextoRespuesta(''); }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Responder
                      </button>
                    )}
                    {puedeModerar && !p.resuelta && (
                      <button onClick={() => marcarResuelta(p.id)} className="text-xs font-medium text-green-600 hover:underline">
                        Marcar como resuelta
                      </button>
                    )}
                    {user && (user.id === p.autorId || puedeModerar) && (
                      <button
                        onClick={() => eliminarPregunta(p.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    )}
                  </div>

                  {respondiendoId === p.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={textoRespuesta}
                        onChange={(e) => setTextoRespuesta(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && enviarRespuesta(p.id)}
                        placeholder="Escribí tu respuesta..."
                        maxLength={3000}
                        className="flex-1 rounded-lg border border-ink/10 bg-cloud-50 px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button
                        onClick={() => enviarRespuesta(p.id)}
                        disabled={!textoRespuesta.trim() || enviandoRespuesta}
                        className="bg-primary text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                      >
                        Enviar
                      </button>
                    </div>
                  )}

                  {p.respuestas.length > 0 && (
                    <div className="mt-4 space-y-3 pl-2 border-l-2 border-primary/20">
                      {p.respuestas.map((r) => (
                        <div key={r.id} className="flex gap-2.5 pl-3">
                          <Avatar nombre={r.autorNombre} esInstructor={r.autorEsInstructor} />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-ink">{r.autorNombre}</span>
                              {r.autorEsInstructor && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  Instructor
                                </span>
                              )}
                              <span className="text-xs text-ink-soft">{formatFecha(r.createdAt)}</span>
                            </div>
                            <p className="text-sm text-ink-muted mt-0.5 whitespace-pre-wrap break-words">{r.texto}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
