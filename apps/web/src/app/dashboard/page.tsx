'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { apiGet, apiPost } from '@/lib/api';
import Link from 'next/link';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { formatearFecha, formatearPrecio } from '@/lib/format';

interface Inscripcion {
  id: string;
  cursoId?: string;
  props?: {
    estudianteId: string;
    cursoId: string;
    fechaInscripcion: string;
    activa: boolean;
  };
  fechaInscripcion?: string;
  activa?: boolean;
}

interface Modulo {
  lecciones: unknown[];
}

interface Curso {
  id: string;
  titulo: string;
  slug: string;
  modulos?: Modulo[];
}

interface CursoProgreso {
  leccionesCompletadas: number;
}

interface CursoConProgreso {
  inscripcionId: string;
  curso: Curso | undefined;
  cursoId: string;
  fechaInscripcion: string;
  totalLecciones: number;
  leccionesCompletadas: number;
  porcentaje: number;
}

interface CursoResumen {
  id: string;
  titulo: string;
  slug: string;
  precio: number;
  imagenUrl?: string;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { clear: clearCart } = useCart();
  const searchParams = useSearchParams();
  const ordenId = searchParams.get('ordenId');
  const [cursos, setCursos] = useState<CursoConProgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [recomendados, setRecomendados] = useState<CursoResumen[]>([]);

  useEffect(() => {
    if (!user) return;

    const confirmAndFetch = async () => {
      try {
        if (ordenId) {
          setConfirming(true);
          await apiPost(`/ordenes/${ordenId}/confirm`, {});
          setConfirming(false);
          clearCart(); // el pago del carrito se confirmó — no dejar los cursos ahí para volver a comprarlos
        }

        const data = await apiGet<Inscripcion[]>(`/inscripciones/estudiante/${user.id}`);

        const normalized = data.map(i => ({
          ...i,
          cursoId: i.cursoId || i.props?.cursoId || '',
          fechaInscripcion: i.fechaInscripcion || i.props?.fechaInscripcion || '',
          activa: i.activa ?? i.props?.activa ?? true,
        }));

        // Trae el detalle completo del curso (para contar lecciones) y el
        // progreso registrado, en paralelo por cada inscripción — no hay un
        // endpoint batch, y para el número de cursos típico de "mis cursos"
        // esto es aceptable.
        const conProgreso = await Promise.all(
          normalized.map(async (insc): Promise<CursoConProgreso> => {
            const cursoId = insc.cursoId || '';
            const [curso, progreso] = await Promise.all([
              cursoId ? apiGet<Curso>(`/cursos/${cursoId}`).catch(() => undefined) : Promise.resolve(undefined),
              cursoId
                ? apiGet<CursoProgreso>(`/progreso/curso/${cursoId}`).catch(() => ({ leccionesCompletadas: 0 }))
                : Promise.resolve({ leccionesCompletadas: 0 }),
            ]);
            const totalLecciones = curso?.modulos?.reduce((acc, m) => acc + m.lecciones.length, 0) || 0;
            return {
              inscripcionId: insc.id,
              curso,
              cursoId,
              fechaInscripcion: insc.fechaInscripcion || '',
              totalLecciones,
              leccionesCompletadas: progreso.leccionesCompletadas,
              porcentaje: totalLecciones > 0
                ? Math.round((progreso.leccionesCompletadas / totalLecciones) * 100)
                : 0,
            };
          }),
        );
        setCursos(conProgreso);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    confirmAndFetch();
  }, [user, ordenId]);

  useEffect(() => {
    if (!user) return;
    apiGet<CursoResumen[]>('/cursos/recomendados/mios')
      .then(setRecomendados)
      .catch(() => {});
  }, [user]);

  if (!user) {
    return <div className="text-center py-16">Debes iniciar sesión</div>;
  }

  if (confirming) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-ink-muted">Confirmando pago y activando acceso...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En una sola fila el título y el link se apretaban en mobile (a 375px
          quedaban los dos partidos en dos líneas, uno al lado del otro):
          apilados abajo de sm y en fila recién desde sm. */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-3xl font-bold">Mis Cursos</h1>
        <Link href="/dashboard/compras" className="text-secondary hover:underline text-sm">
          Ver mis compras y comprobantes →
        </Link>
      </div>
      {loading ? (
        // Antes era el texto "Cargando...": la espera acá es larga (una
        // request de curso + una de progreso por inscripción), así que se
        // usa el mismo skeleton de tarjetas que el catálogo.
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-cloud-100 rounded-xl p-6 border border-ink/[0.07] animate-pulse">
              <div className="h-5 bg-ink/[0.06] rounded w-3/4 mb-3" />
              <div className="h-4 bg-ink/[0.06] rounded w-1/2 mb-5" />
              <div className="h-2 bg-ink/[0.06] rounded w-full mb-5" />
              <div className="h-10 bg-ink/[0.06] rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-16 bg-cloud-100 rounded-xl border border-ink/[0.07]">
          <p className="text-ink-muted mb-4">No tienes cursos inscritos</p>
          <Link href="/cursos" className="text-secondary hover:underline">
            Explorar cursos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((item) => (
            <div key={item.inscripcionId} className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
              <h3 className="font-semibold mb-2">
                {item.curso?.titulo || `Curso ${item.cursoId.slice(0, 8)}...`}
              </h3>
              <p className="text-sm text-ink-muted mb-3">
                Inscrito: {formatearFecha(item.fechaInscripcion)}
              </p>

              {item.totalLecciones > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-ink-muted">
                      {item.leccionesCompletadas}/{item.totalLecciones} lecciones
                    </span>
                    <span className="text-xs font-semibold text-primary">{item.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-cloud-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                </div>
              )}

              <Link
                href={`/aprender/${item.cursoId}`}
                className="block text-center bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
              >
                {item.porcentaje > 0 ? 'Continuar' : 'Empezar'}
              </Link>
            </div>
          ))}
        </div>
      )}

      {recomendados.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Recomendado para vos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recomendados.map((curso) => (
              <Link key={curso.id} href={`/cursos/${curso.slug}`}>
                <div className="card overflow-hidden p-0 cursor-pointer h-full flex flex-col">
                  <CourseCoverImage imagenUrl={curso.imagenUrl} titulo={curso.titulo} className="w-full aspect-video" />
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-ink mb-1 line-clamp-2">{curso.titulo}</h3>
                    <p className="font-extrabold text-ink mt-auto">{formatearPrecio(curso.precio)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
