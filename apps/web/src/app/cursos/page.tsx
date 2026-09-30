import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CourseCard } from '@/components/CourseCard';
import { CatalogoCursos, ListadoCursos } from '@/components/CatalogoCursos';
import { SERVER_API_URL } from '@/lib/api';

// Acá y no en un cursos/layout.tsx: un `title` plano en el layout cortaba el
// template "%s | Sueños Dev" para /cursos/[slug], y su canonical '/cursos'
// lo heredaba cualquier página hija que no definiera el suyo.
export const metadata: Metadata = {
  title: 'Catálogo de Cursos',
  description: 'Explorá todos los cursos disponibles en Sueños Dev — programación, diseño y más, con certificados verificables.',
  alternates: { canonical: '/cursos' },
};

async function getPrimeraPagina(): Promise<ListadoCursos | null> {
  try {
    const res = await fetch(`${SERVER_API_URL}/cursos?page=1`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * La página era entera 'use client': el HTML que recibían Google y los
 * crawlers de IA traía la grilla vacía (los cursos llegaban después, por
 * fetch en el navegador). Ahora el servidor trae la primera página y la
 * renderiza en el HTML inicial.
 *
 * CatalogoCursos usa useSearchParams, que en una ruta estática hace que todo
 * hasta el <Suspense> más cercano se renderice solo en el cliente — por eso
 * el fallback no es un spinner sino la misma grilla ya renderizada en el
 * servidor: eso es lo que queda en el HTML, y el catálogo interactivo la
 * reemplaza al hidratar.
 */
export default async function CursosPage() {
  const inicial = await getPrimeraPagina();
  return (
    <Suspense fallback={<CatalogoEstatico inicial={inicial} />}>
      <CatalogoCursos inicial={inicial} />
    </Suspense>
  );
}

function CatalogoEstatico({ inicial }: { inicial: ListadoCursos | null }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-ink">Cursos Disponibles</h1>
      {inicial && inicial.total > 0 && (
        <p className="text-ink-soft text-sm mb-4">
          {inicial.total} {inicial.total === 1 ? 'curso encontrado' : 'cursos encontrados'}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inicial?.cursos.map((curso) => <CourseCard key={curso.id} curso={curso} />)}
      </div>
    </div>
  );
}
