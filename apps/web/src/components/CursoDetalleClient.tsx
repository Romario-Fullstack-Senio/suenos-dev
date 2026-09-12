'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PlayCircle, ChevronDown, Users, Award, Clock, User, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { ReviewsSection } from '@/components/ReviewsSection';
import { RelatedCourses } from '@/components/RelatedCourses';
import { WishlistButton } from '@/components/WishlistButton';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { apiGet } from '@/lib/api';
import { formatearPrecio } from '@/lib/format';

// LessonPreviewModal carga HLSPlayer -> hls.js (~175kB minificado), y esta
// página solo lo necesita si el usuario hace click en "Vista previa" de una
// lección. Como import estático, ese peso viajaba en el First Load JS de
// TODA visita a /cursos/[slug] aunque nadie abriera el modal. ssr: false
// porque HLSPlayer usa el DOM (crea el elemento <video> y adjunta hls.js).
const LessonPreviewModal = dynamic(
  () => import('@/components/LessonPreviewModal').then((m) => m.LessonPreviewModal),
  { ssr: false },
);

export interface Leccion {
  id: string;
  titulo: string;
  orden: number;
  duracionSegundos: number;
  videoUrl?: string;
  esVistaPrevia?: boolean;
}

export interface Modulo {
  id: string;
  titulo: string;
  orden: number;
  lecciones: Leccion[];
}

export interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  slug: string;
  precio: number;
  estado: string;
  instructorId: string;
  instructorNombre?: string;
  modulos: Modulo[];
  imagenUrl?: string;
  categoria?: string;
  nivel?: string;
  objetivos?: string[];
  requisitos?: string[];
  audiencia?: string;
  alumnosInscriptos?: number;
}

interface Inscripcion {
  cursoId: string;
  activa: boolean;
}

function formatearDuracion(totalSegundos: number): string {
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  if (horas === 0) return `${minutos} min`;
  return `${horas}h ${minutos}min`;
}

export function CursoDetalleClient({ curso }: { curso: Curso }) {
  const { user, isAuthenticated } = useAuth();
  const { addItem, isInCart } = useCart();
  const [vistaPrevia, setVistaPrevia] = useState<Leccion | null>(null);
  const [yaInscripto, setYaInscripto] = useState(false);
  const [verificandoAcceso, setVerificandoAcceso] = useState(isAuthenticated);
  const [moduloAbierto, setModuloAbierto] = useState<string | null>(curso.modulos[0]?.id ?? null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setVerificandoAcceso(false);
      return;
    }
    apiGet<Inscripcion[]>(`/inscripciones/estudiante/${user.id}`)
      .then(inscripciones => {
        setYaInscripto(inscripciones.some(i => i.cursoId === curso.id && i.activa));
      })
      .catch(() => {})
      .finally(() => setVerificandoAcceso(false));
  }, [isAuthenticated, user, curso.id]);

  const totalLecciones = curso.modulos.reduce((sum, m) => sum + m.lecciones.length, 0);
  const totalSegundos = curso.modulos.reduce(
    (sum, m) => sum + m.lecciones.reduce((s, l) => s + l.duracionSegundos, 0),
    0,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-ink-soft mb-4 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-ink transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/cursos" className="hover:text-ink transition-colors">Cursos</Link>
        {curso.categoria && (
          <>
            <span>/</span>
            <Link href={`/cursos?categoria=${encodeURIComponent(curso.categoria)}`} className="hover:text-ink transition-colors">
              {curso.categoria}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink truncate max-w-[200px]">{curso.titulo}</span>
      </nav>

      {/* Dos columnas en desktop: precio y CTA viven en un aside sticky.
          Antes estaban en una caja arriba y desaparecían con el scroll — el
          usuario evalúa objetivos, módulos y reseñas durante varias
          pantallas y, cuando se convence, no había botón a la vista. En
          mobile el aside cae en el flujo justo después de la intro, donde ya
          estaba. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-8 lg:items-start">
      <div className="lg:col-start-1">

      <CourseCoverImage
        imagenUrl={curso.imagenUrl}
        titulo={curso.titulo}
        className="w-full h-56 md:h-72 rounded-xl mb-6"
      />

      <div className="bg-cloud-100 rounded-xl p-8 shadow-sm border border-ink/[0.07] mb-8">
        <h1 className="text-3xl font-bold mb-2">{curso.titulo}</h1>

        {curso.instructorNombre && (
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted mb-4">
            <User className="w-4 h-4" />
            Por {curso.instructorNombre}
          </p>
        )}

        <p className="text-ink-muted mb-4">{curso.descripcion}</p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted mb-6">
          {typeof curso.alumnosInscriptos === 'number' && curso.alumnosInscriptos > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              {curso.alumnosInscriptos} {curso.alumnosInscriptos === 1 ? 'alumno' : 'alumnos'}
            </span>
          )}
          {totalSegundos > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              {formatearDuracion(totalSegundos)} de contenido
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-accent" />
            Certificado incluido
          </span>
        </div>

      </div>

      </div>

      <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 mb-8">
        <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
          <p className="text-3xl font-extrabold text-ink mb-5">{formatearPrecio(curso.precio)}</p>

          {verificandoAcceso ? (
            <div className="h-12 w-full bg-ink/[0.06] rounded-lg animate-pulse" />
          ) : yaInscripto ? (
            <Link
              href={`/aprender/${curso.id}`}
              className="block text-center bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Ir al curso
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href={`/checkout?cursoId=${curso.id}`}
                className="block text-center bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Comprar ahora
              </Link>
              <div className="flex items-center gap-3">
                {isInCart(curso.id) ? (
                  <span className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-secondary bg-secondary/10">
                    <Check className="w-4 h-4" /> En el carrito
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      addItem({ cursoId: curso.id, titulo: curso.titulo, precio: curso.precio, imagenUrl: curso.imagenUrl, slug: curso.slug });
                      toast.success('Agregado al carrito');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-ink border border-ink/[0.12] hover:bg-cloud-100 transition"
                  >
                    <ShoppingCart className="w-4 h-4" /> Al carrito
                  </button>
                )}
                <WishlistButton cursoId={curso.id} className="w-11 h-11 flex-shrink-0 border border-ink/[0.12] hover:bg-cloud-100" />
              </div>
            </div>
          )}

          <ul className="mt-5 pt-4 border-t border-ink/[0.07] space-y-2 text-sm text-ink-muted">
            <li>
              {totalLecciones} {totalLecciones === 1 ? 'lección' : 'lecciones'} en {curso.modulos.length}{' '}
              {curso.modulos.length === 1 ? 'módulo' : 'módulos'}
            </li>
            {totalSegundos > 0 && <li>{formatearDuracion(totalSegundos)} de contenido en video</li>}
            <li>Certificado verificable al terminar</li>
          </ul>
        </div>
      </aside>

      <div className="lg:col-start-1">

      {curso.objetivos && curso.objetivos.length > 0 && (
        <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] mb-6">
          <h2 className="font-semibold text-lg mb-4 text-ink">Qué vas a aprender</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {curso.objetivos.map((objetivo, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                <span className="text-primary mt-0.5">✓</span>
                {objetivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(curso.requisitos && curso.requisitos.length > 0) || curso.audiencia ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {curso.requisitos && curso.requisitos.length > 0 && (
            <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
              <h2 className="font-semibold text-lg mb-3 text-ink">Requisitos</h2>
              <ul className="space-y-1.5">
                {curso.requisitos.map((r, i) => (
                  <li key={i} className="text-sm text-ink-muted flex items-start gap-2">
                    <span className="text-ink-soft mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {curso.audiencia && (
            <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
              <h2 className="font-semibold text-lg mb-3 text-ink">¿Para quién es este curso?</h2>
              <p className="text-sm text-ink-muted">{curso.audiencia}</p>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Contenido del Curso</h2>
        <span className="text-sm text-ink-soft">
          {curso.modulos.length} {curso.modulos.length === 1 ? 'módulo' : 'módulos'} · {totalLecciones} {totalLecciones === 1 ? 'lección' : 'lecciones'}
        </span>
      </div>
      <div className="space-y-3">
        {curso.modulos.map((modulo) => {
          const abierto = moduloAbierto === modulo.id;
          return (
            <div key={modulo.id} className="bg-cloud-100 rounded-xl shadow-sm border border-ink/[0.07] overflow-hidden">
              <button
                type="button"
                onClick={() => setModuloAbierto(abierto ? null : modulo.id)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h3 className="font-semibold text-lg">
                  Módulo {modulo.orden}: {modulo.titulo}
                </h3>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-ink-soft">{modulo.lecciones.length} lecciones</span>
                  <ChevronDown className={`w-5 h-5 text-ink-soft transition-transform ${abierto ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {abierto && (
                <ul className="space-y-2 px-6 pb-6">
                  {modulo.lecciones.map((leccion) => (
                    <li key={leccion.id} className="flex items-center gap-3 text-ink">
                      <span className="w-6 h-6 bg-cloud-50 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                        {leccion.orden}
                      </span>
                      <span>{leccion.titulo}</span>
                      {leccion.esVistaPrevia && leccion.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setVistaPrevia(leccion)}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Vista previa
                        </button>
                      )}
                      <span className="text-ink-soft text-sm ml-auto">
                        {Math.floor(leccion.duracionSegundos / 60)}:{String(leccion.duracionSegundos % 60).padStart(2, '0')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <ReviewsSection cursoId={curso.id} />

      <RelatedCourses cursoId={curso.id} />

      </div>
      </div>

      {vistaPrevia?.videoUrl && (
        <LessonPreviewModal
          titulo={vistaPrevia.titulo}
          videoUrl={vistaPrevia.videoUrl}
          onClose={() => setVistaPrevia(null)}
        />
      )}
    </div>
  );
}
