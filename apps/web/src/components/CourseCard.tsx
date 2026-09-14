import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { formatearPrecio } from '@/lib/format';
import type { ReactNode } from 'react';

export interface CursoCard {
  id: string;
  titulo: string;
  slug: string;
  precio: number;
  imagenUrl?: string;
  categoria?: string;
  nivel?: string;
  instructorNombre?: string;
  esOficial?: boolean;
  esNuevo?: boolean;
}

const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

/**
 * Card de curso para catálogo/home/relacionados: la imagen queda limpia por
 * defecto (solo badges siempre visibles arriba) y el título, instructor,
 * precio y el CTA "Ir al curso" viven en un overlay sobre la imagen que en
 * desktop aparece recién al hacer hover (`sm:opacity-0 sm:group-hover:...`).
 * En mobile no hay hover real, así que el overlay queda siempre visible ahí
 * — si no, nadie vería ni el título sin tocar la card. Al hacer click (en
 * cualquier tamaño de pantalla) navega al detalle normal del curso, sin
 * ningún cambio — "todo lo normal como está".
 *
 * `topRightSlot` es para el botón de favoritos que algunas páginas overlayan
 * (necesita estar afuera del <Link> que cubre toda la card para no anidar
 * elementos interactivos).
 */
export function CourseCard({ curso, topRightSlot }: { curso: CursoCard; topRightSlot?: ReactNode }) {
  const gratis = curso.precio === 0;

  return (
    <article className="card-hover group relative flex h-full flex-col overflow-hidden rounded-2xl p-0">
      <Link href={`/cursos/${curso.slug}`} aria-label={curso.titulo} className="absolute inset-0 z-10">
        <span className="sr-only">{curso.titulo}</span>
      </Link>

      <CourseCoverImage imagenUrl={curso.imagenUrl} titulo={curso.titulo} className="aspect-video w-full" />

      {/* Badges siempre visibles, arriba de la imagen. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <div className="flex flex-wrap gap-1.5">
          {curso.esOficial && (
            // Fijo (no bg-ink/text-ink): esto va siempre arriba de una foto,
            // no de la superficie de la app — con los tokens de tema, en modo
            // oscuro bg-ink se vuelve casi blanco y el texto blanco desaparece.
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Oficial
            </span>
          )}
          {curso.esNuevo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-on-brand">
              <Sparkles className="h-3 w-3" aria-hidden /> Nuevo
            </span>
          )}
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5">
          {gratis && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-on-brand">Gratis</span>
          )}
          {topRightSlot}
        </div>
      </div>

      {/* Overlay con la info — hover-only en desktop, siempre visible en mobile. */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-4 pt-10
                   opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100"
      >
        {(curso.categoria || curso.nivel) && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {curso.categoria && (
              <span className="inline-block rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white">
                {curso.categoria}
              </span>
            )}
            {curso.nivel && (
              <span className="inline-block rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white">
                {NIVEL_LABEL[curso.nivel] ?? curso.nivel}
              </span>
            )}
          </div>
        )}
        <h3 className="mb-0.5 line-clamp-2 text-base font-bold text-white">{curso.titulo}</h3>
        {curso.instructorNombre && (
          <p className="mb-2 text-xs text-white/70">Por {curso.instructorNombre}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-white">{gratis ? 'Gratis' : formatearPrecio(curso.precio)}</span>
          {/* text-slate-900 fijo, no text-ink: en modo oscuro text-ink es casi
              blanco y quedaba invisible sobre este mismo bg-white fijo. */}
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-900">
            Ir al curso <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}
