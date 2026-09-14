'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseCard } from '@/components/CourseCard';
import { WishlistButton } from '@/components/WishlistButton';
import { useAuth } from '@/contexts/AuthContext';

interface Curso {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  categoria?: string;
  nivel?: string;
  instructorNombre?: string;
  alumnosInscriptos?: number;
  esOficial?: boolean;
  esNuevo?: boolean;
}

interface ListadoCursos {
  cursos: Curso[];
  total: number;
  page: number;
  totalPages: number;
}

const INPUT_CLASS =
  'px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40';

function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden p-0 h-full flex flex-col animate-pulse">
      <div className="w-full aspect-video bg-ink/[0.06]" />
      <div className="p-6 flex flex-col flex-1 gap-2">
        <div className="h-5 bg-ink/[0.06] rounded w-3/4" />
        <div className="h-4 bg-ink/[0.06] rounded w-full" />
        <div className="h-4 bg-ink/[0.06] rounded w-2/3" />
        <div className="h-5 bg-ink/[0.06] rounded w-1/3 mt-auto" />
      </div>
    </div>
  );
}

export default function CursosPage() {
  return (
    <Suspense fallback={null}>
      <CatalogoContent />
    </Suspense>
  );
}

function CatalogoContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Los filtros viven en la URL, no en estado local. Antes eran useState: el
  // breadcrumb del detalle de curso enlaza a /cursos?categoria=X y esta
  // página ignoraba el query param por completo, además de no poder
  // compartir una búsqueda ni volver atrás sin perder los filtros.
  const q = params.get('q') ?? '';
  const categoria = params.get('categoria') ?? '';
  const nivel = params.get('nivel') ?? '';
  const sort = params.get('sort') ?? 'reciente';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(q);

  const setParams = useCallback(
    (cambios: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [clave, valor] of Object.entries(cambios)) {
        if (!valor) next.delete(clave);
        else next.set(clave, valor);
      }
      // Cualquier cambio de filtro vuelve a la página 1.
      if (!('page' in cambios)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Categorías para el filtro: se cargan una sola vez, sin filtros, para que
  // no desaparezcan opciones del dropdown al filtrar por categoría/nivel.
  useEffect(() => {
    apiGet<ListadoCursos>('/cursos?limit=100')
      .then(data => setCategorias(Array.from(new Set(data.cursos.map(c => c.categoria).filter(Boolean))) as string[]))
      .catch(() => {});
  }, []);

  // Debounce solo del texto libre: escribir no debe empujar una entrada de
  // historial ni una request por tecla.
  useEffect(() => {
    if (searchInput === q) return;
    const timeout = setTimeout(() => setParams({ q: searchInput.trim() || null }), 300);
    return () => clearTimeout(timeout);
  }, [searchInput, q, setParams]);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    const busqueda = new URLSearchParams();
    if (q.trim()) busqueda.set('search', q.trim());
    if (categoria) busqueda.set('categoria', categoria);
    if (nivel) busqueda.set('nivel', nivel);
    if (sort !== 'reciente') busqueda.set('sort', sort);
    busqueda.set('page', String(page));

    apiGet<ListadoCursos>(`/cursos?${busqueda.toString()}`)
      .then(data => {
        if (cancelado) return;
        setCursos(data.cursos);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(error => {
        if (!cancelado) console.error('Error:', error);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [q, categoria, nivel, sort, page]);

  const irAPagina = (nueva: number) => {
    if (nueva < 1 || nueva > totalPages) return;
    setParams({ page: nueva === 1 ? null : String(nueva) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-ink">Cursos Disponibles</h1>

      <div className="card mb-8 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
          <input
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar cursos por título o descripción..."
            aria-label="Buscar cursos"
            className={`w-full pl-9 pr-3 ${INPUT_CLASS}`}
          />
        </div>
        <select
          value={categoria}
          onChange={e => setParams({ categoria: e.target.value || null })}
          aria-label="Filtrar por categoría"
          className={INPUT_CLASS}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={nivel}
          onChange={e => setParams({ nivel: e.target.value || null })}
          aria-label="Filtrar por nivel"
          className={INPUT_CLASS}
        >
          <option value="">Todos los niveles</option>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
        <select
          value={sort}
          onChange={e => setParams({ sort: e.target.value === 'reciente' ? null : e.target.value })}
          aria-label="Ordenar"
          className={INPUT_CLASS}
        >
          <option value="reciente">Más recientes</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
        </select>
      </div>

      {!loading && total > 0 && (
        <p className="text-ink-soft text-sm mb-4">{total} {total === 1 ? 'curso encontrado' : 'cursos encontrados'}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted mb-4">No se encontraron cursos con esos filtros</p>
          <button
            type="button"
            onClick={() => {
              // setParams SOLO toca el q de la URL. El efecto de debounce sigue
              // mirando [searchInput, q] y, si searchInput no se resetea acá, 300ms
              // después ve searchInput !== q y vuelve a mandar el texto viejo como
              // búsqueda — el botón "limpiaba" la URL y la búsqueda volvía sola.
              setSearchInput('');
              setParams({ q: null, categoria: null, nivel: null, sort: null });
            }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso) => (
              <CourseCard
                key={curso.id}
                curso={curso}
                topRightSlot={
                  isAuthenticated ? (
                    <WishlistButton
                      cursoId={curso.id}
                      className="h-8 w-8 bg-cloud-50/90 shadow-sm backdrop-blur-sm"
                    />
                  ) : undefined
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                type="button"
                onClick={() => irAPagina(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-ink/[0.12] text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cloud-100 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-ink-muted">Página {page} de {totalPages}</span>
              <button
                type="button"
                onClick={() => irAPagina(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-ink/[0.12] text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cloud-100 transition-colors"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
