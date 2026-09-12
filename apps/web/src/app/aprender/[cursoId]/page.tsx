'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FileDown, Lock } from 'lucide-react';

const HLSPlayer = dynamic(() => import('@/components/HLSPlayer'), { ssr: false });
const QASection = dynamic(() => import('@/components/QASection'), { ssr: false });

interface RecursoLeccion {
  nombre: string;
  archivo: string;
  url: string;
}

interface Leccion {
  id: string;
  titulo: string;
  orden: number;
  duracionSegundos: number;
  videoUrl?: string;
  subtitulosUrl?: string;
  recursos?: RecursoLeccion[];
  diasDesdeInscripcion?: number;
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
  instructorId: string;
  modulos: Modulo[];
}

interface Progreso {
  leccionId: string;
  porcentaje: number;
  completada: boolean;
}

interface CursoProgreso {
  totalLecciones: number;
  leccionesCompletadas: number;
  porcentajeTotal: number;
  progresos: Progreso[];
}

interface InscripcionRaw {
  cursoId?: string;
  props?: { cursoId: string; fechaInscripcion: string };
  fechaInscripcion?: string;
}

export default function AprenderPage() {
  const params = useParams();
  const cursoId = params.cursoId as string;
  const { user } = useAuth();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [leccionActual, setLeccionActual] = useState<Leccion | null>(null);
  const [moduloActual, setModuloActual] = useState<Modulo | null>(null);
  const [progreso, setProgreso] = useState<CursoProgreso | null>(null);
  const [fechaInscripcion, setFechaInscripcion] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  // Último `segundosVistos` reportado al backend para la lección actual —
  // evita mandar un POST en cada tick de "timeupdate" (dispara ~4 veces por
  // segundo) y evita retroceder el progreso si el estudiante hace seek hacia
  // atrás (el backend guarda el porcentaje tal cual se lo mandemos).
  const ultimoReportadoRef = useRef(0);
  const ultimoEnvioRef = useRef(0);

  // `user` puede tardar en llegar (AuthContext lo carga de localStorage de
  // forma async) — sin `user` en las dependencias, si el efecto corría
  // antes de que cargara, el progreso y la fecha de inscripción quedaban
  // sin pedirse para siempre (nunca había un segundo intento).
  useEffect(() => {
    fetchData();
  }, [cursoId, user]);

  useEffect(() => {
    ultimoReportadoRef.current = 0;
    ultimoEnvioRef.current = 0;
  }, [leccionActual]);

  async function fetchData() {
    try {
      const [cursoData, progresoData, inscripciones] = await Promise.all([
        apiGet<Curso>(`/cursos/${cursoId}`),
        user ? apiGet<CursoProgreso>(`/progreso/curso/${cursoId}`) : null,
        user ? apiGet<InscripcionRaw[]>(`/inscripciones/estudiante/${user.id}`).catch(() => []) : Promise.resolve([]),
      ]);
      setCurso(cursoData);
      if (progresoData) {
        const totalLecciones = cursoData.modulos.reduce(
          (acc, m) => acc + m.lecciones.length, 0
        );
        setProgreso({
          ...progresoData,
          totalLecciones,
          porcentajeTotal: totalLecciones > 0
            ? Math.round((progresoData.leccionesCompletadas / totalLecciones) * 100)
            : 0,
        });
      }

      const miInscripcion = inscripciones.find(
        (i) => (i.cursoId || i.props?.cursoId) === cursoId,
      );
      const fechaInsc = miInscripcion
        ? new Date(miInscripcion.fechaInscripcion || miInscripcion.props?.fechaInscripcion || '')
        : null;
      setFechaInscripcion(fechaInsc);

      // El instructor/admin viendo su propio contenido no tiene inscripción
      // (fechaInsc null) — en ese caso todo se trata como disponible, ver
      // estaDisponible().
      const primeraDisponible = cursoData.modulos
        .flatMap((m) => m.lecciones.map((lec) => ({ mod: m, lec })))
        .find(({ lec }) => estaDisponible(lec, fechaInsc));

      if (primeraDisponible) {
        setModuloActual(primeraDisponible.mod);
        setLeccionActual(primeraDisponible.lec);
      } else if (cursoData.modulos?.length > 0 && cursoData.modulos[0].lecciones?.length > 0) {
        setModuloActual(cursoData.modulos[0]);
        setLeccionActual(cursoData.modulos[0].lecciones[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Sin fecha de inscripción (instructor/admin previsualizando, o todavía
  // no cargó) no hay forma de calcular el bloqueo — se trata como
  // disponible en vez de bloquear a ciegas.
  function estaDisponible(lec: Leccion, fechaInsc: Date | null): boolean {
    if (!lec.diasDesdeInscripcion || !fechaInsc) return true;
    const disponibleDesde = new Date(fechaInsc);
    disponibleDesde.setDate(disponibleDesde.getDate() + lec.diasDesdeInscripcion);
    return new Date() >= disponibleDesde;
  }

  function fechaDisponibilidad(lec: Leccion, fechaInsc: Date | null): Date | null {
    if (!lec.diasDesdeInscripcion || !fechaInsc) return null;
    const disponibleDesde = new Date(fechaInsc);
    disponibleDesde.setDate(disponibleDesde.getDate() + lec.diasDesdeInscripcion);
    return disponibleDesde;
  }

  async function trackProgress(leccion: Leccion, segundos: number, duracionTotal: number) {
    if (!user) return;
    try {
      // Sin ?estudianteId: la API lo toma del JWT (mandarlo desde el cliente
      // dejaba escribir/leer progreso de otro usuario cambiando el param).
      await apiPost('/progreso', {
        leccionId: leccion.id,
        cursoId,
        segundosVistos: segundos,
        duracionTotal: duracionTotal || leccion.duracionSegundos || 60,
      });
      const data = await apiGet<CursoProgreso>(`/progreso/curso/${cursoId}`);
      const totalLecciones = curso?.modulos.reduce(
        (acc, m) => acc + m.lecciones.length, 0
      ) || 0;
      setProgreso({
        ...data,
        totalLecciones,
        porcentajeTotal: totalLecciones > 0
          ? Math.round((data.leccionesCompletadas / totalLecciones) * 100)
          : 0,
      });
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  }

  // Se llama en cada "timeupdate" del video (con la posición real de
  // reproducción, no un contador simulado). Throttled a ~10s para no
  // saturar la API, pero reporta de inmediato si el estudiante ya cruzó el
  // umbral del 90% (para que se vea "completada" sin esperar el próximo
  // tick) o si retrocedió el progreso reportado.
  function handleVideoProgress(currentTime: number, duration: number) {
    if (!leccionActual || !user) return;
    const segundos = Math.floor(currentTime);
    const ahora = Date.now();
    const cruzoUmbral = duration > 0 && segundos / duration >= 0.9 && ultimoReportadoRef.current / duration < 0.9;
    if (!cruzoUmbral && ahora - ultimoEnvioRef.current < 10000) return;
    if (segundos <= ultimoReportadoRef.current && !cruzoUmbral) return;

    ultimoReportadoRef.current = segundos;
    ultimoEnvioRef.current = ahora;
    trackProgress(leccionActual, segundos, Math.floor(duration));
  }

  // El "ended" del <video> dispara SIEMPRE al terminar, sin depender del
  // muestreo de timeupdate — así la lección se marca completada al
  // instante en vez de esperar el próximo tick (que podía no llegar nunca
  // si el video duraba menos que el intervalo de reporte).
  function handleVideoEnded() {
    if (!leccionActual || !user) return;
    const duracionTotal = leccionActual.duracionSegundos || 60;
    ultimoReportadoRef.current = duracionTotal;
    ultimoEnvioRef.current = Date.now();
    trackProgress(leccionActual, duracionTotal, duracionTotal);
  }

  const seleccionarLeccion = (mod: Modulo, lec: Leccion) => {
    if (!estaDisponible(lec, fechaInscripcion)) return;
    setModuloActual(mod);
    setLeccionActual(lec);
  };

  if (loading) return <p className="text-center py-16">Cargando curso...</p>;
  if (!curso) return <p className="text-center py-16">Curso no encontrado</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {progreso && (
        <div className="mb-6 bg-cloud-100 rounded-xl p-4 shadow-sm border border-ink/[0.07]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-ink">Progreso del curso</span>
            <span className="text-sm text-ink-muted">
              {progreso.leccionesCompletadas}/{progreso.totalLecciones} lecciones
            </span>
          </div>
          <div className="w-full bg-cloud-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progreso.porcentajeTotal}%` }}
            />
          </div>
          <p className="text-xs text-ink-muted mt-1">{progreso.porcentajeTotal}% completado</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Módulos</h2>
          <div className="space-y-4">
            {[...curso.modulos].sort((a, b) => a.orden - b.orden).map((mod) => (
              <div key={mod.id}>
                <h3 className="font-medium text-sm text-ink mb-2">
                  {mod.orden}. {mod.titulo}
                </h3>
                <ul className="space-y-1 ml-3">
                  {[...mod.lecciones].sort((a, b) => a.orden - b.orden).map((lec) => {
                    const lecProgreso = progreso?.progresos.find(p => p.leccionId === lec.id);
                    const disponible = estaDisponible(lec, fechaInscripcion);
                    const desde = fechaDisponibilidad(lec, fechaInscripcion);
                    return (
                      <li key={lec.id}>
                        <button
                          onClick={() => seleccionarLeccion(mod, lec)}
                          disabled={!disponible}
                          title={!disponible && desde ? `Disponible el ${desde.toLocaleDateString('es', { day: 'numeric', month: 'short' })}` : undefined}
                          className={`text-left text-sm w-full px-2 py-1 rounded flex items-center gap-2 ${
                            !disponible
                              ? 'text-ink-soft/60 cursor-not-allowed'
                              : leccionActual?.id === lec.id
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-ink-muted hover:bg-cloud-50'
                          }`}
                        >
                          {!disponible ? (
                            <Lock className="w-3 h-3 flex-shrink-0" />
                          ) : lecProgreso?.completada ? (
                            <span className="text-green-500">✓</span>
                          ) : lecProgreso ? (
                            <span className="text-yellow-500">◐</span>
                          ) : (
                            <span className="text-ink-soft">○</span>
                          )}
                          <span className="truncate">{lec.orden}. {lec.titulo}</span>
                          {!disponible && desde && (
                            <span className="ml-auto text-[10px] text-ink-soft flex-shrink-0">
                              {desde.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-3">
          {leccionActual?.videoUrl ? (
            <HLSPlayer
              src={leccionActual.videoUrl}
              subtitulosUrl={leccionActual.subtitulosUrl}
              onProgress={handleVideoProgress}
              onEnded={handleVideoEnded}
            />
          ) : (
            <div className="bg-cloud-50 aspect-video rounded-xl flex items-center justify-center text-white mb-6">
              <p className="text-ink-soft">Video no disponible</p>
            </div>
          )}

          <h1 className="text-2xl font-bold mb-2">{leccionActual?.titulo || 'Selecciona una lección'}</h1>
          <p className="text-ink-muted">
            {moduloActual?.titulo && `Módulo: ${moduloActual.titulo}`}
          </p>

          <div className="flex gap-4 mt-6">
            <Link
              href={`/aprender/${cursoId}/quiz`}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
            >
              Tomar Quiz Final
            </Link>
            {progreso?.porcentajeTotal === 100 && (
              <Link
                href={`/certificados`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
              >
                Ver Certificado
              </Link>
            )}
          </div>

          {!!leccionActual?.recursos?.length && (
            <div className="mt-6 bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
              <h2 className="text-lg font-semibold mb-3 text-ink">Recursos de la lección</h2>
              <ul className="space-y-2">
                {leccionActual.recursos.map((r) => {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                  const href = token ? `${r.url}?token=${token}` : r.url;
                  return (
                    <li key={r.archivo}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileDown className="w-4 h-4" /> {r.nombre}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {leccionActual && (
            <QASection
              key={leccionActual.id}
              leccionId={leccionActual.id}
              puedeModerar={!!user && (user.rol === 'admin' || user.id === curso.instructorId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
