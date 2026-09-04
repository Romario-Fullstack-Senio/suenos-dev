'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const HLSPlayer = dynamic(() => import('@/components/HLSPlayer'), { ssr: false });
const QASection = dynamic(() => import('@/components/QASection'), { ssr: false });

interface Leccion {
  id: string;
  titulo: string;
  orden: number;
  duracionSegundos: number;
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

export default function AprenderPage() {
  const params = useParams();
  const cursoId = params.cursoId as string;
  const { user } = useAuth();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [leccionActual, setLeccionActual] = useState<Leccion | null>(null);
  const [moduloActual, setModuloActual] = useState<Modulo | null>(null);
  const [progreso, setProgreso] = useState<CursoProgreso | null>(null);
  const [loading, setLoading] = useState(true);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Acumula segundos "vistos" mientras la lección está abierta. Antes se
  // mandaban siempre los mismos 30/60 en cada tick — la lección quedaba
  // clavada en 50% para siempre y nunca llegaba al 90% para marcarse
  // completada. No lee el tiempo real del reproductor (eso requeriría
  // engancharse a HLS.js), pero al menos progresa con el tiempo real.
  const segundosVistosRef = useRef(0);

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  useEffect(() => {
    segundosVistosRef.current = 0;
    if (leccionActual && user) {
      progressTimerRef.current = setInterval(() => {
        segundosVistosRef.current += 30;
        trackProgress(leccionActual, segundosVistosRef.current);
      }, 30000);

      return () => {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
        }
      };
    }
  }, [leccionActual, user]);

  async function fetchData() {
    try {
      const [cursoData, progresoData] = await Promise.all([
        apiGet<Curso>(`/cursos/${cursoId}`),
        user ? apiGet<CursoProgreso>(`/progreso/curso/${cursoId}?estudianteId=${user.id}`) : null,
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
      if (cursoData.modulos?.length > 0 && cursoData.modulos[0].lecciones?.length > 0) {
        setModuloActual(cursoData.modulos[0]);
        setLeccionActual(cursoData.modulos[0].lecciones[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function trackProgress(leccion: Leccion, segundos: number) {
    if (!user) return;
    try {
      await apiPost('/progreso?estudianteId=' + user.id, {
        leccionId: leccion.id,
        cursoId,
        segundosVistos: segundos,
        duracionTotal: leccion.duracionSegundos || 60,
      });
      const data = await apiGet<CursoProgreso>(`/progreso/curso/${cursoId}?estudianteId=${user.id}`);
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

  const seleccionarLeccion = (mod: Modulo, lec: Leccion) => {
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
            {curso.modulos.map((mod) => (
              <div key={mod.id}>
                <h3 className="font-medium text-sm text-ink mb-2">
                  {mod.orden}. {mod.titulo}
                </h3>
                <ul className="space-y-1 ml-3">
                  {mod.lecciones.map((lec) => {
                    const lecProgreso = progreso?.progresos.find(p => p.leccionId === lec.id);
                    return (
                      <li key={lec.id}>
                        <button
                          onClick={() => seleccionarLeccion(mod, lec)}
                          className={`text-left text-sm w-full px-2 py-1 rounded flex items-center gap-2 ${
                            leccionActual?.id === lec.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-ink-muted hover:bg-white'
                          }`}
                        >
                          {lecProgreso?.completada ? (
                            <span className="text-green-500">✓</span>
                          ) : lecProgreso ? (
                            <span className="text-yellow-500">◐</span>
                          ) : (
                            <span className="text-ink-soft">○</span>
                          )}
                          {lec.orden}. {lec.titulo}
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
            <HLSPlayer src={leccionActual.videoUrl} subtitulosUrl={leccionActual.subtitulosUrl} />
          ) : (
            <div className="bg-white aspect-video rounded-xl flex items-center justify-center text-white mb-6">
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
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
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
