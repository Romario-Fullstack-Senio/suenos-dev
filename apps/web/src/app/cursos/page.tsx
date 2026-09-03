'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import Link from 'next/link';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseCoverImage } from '@/components/CourseCoverImage';

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
}

interface ListadoCursos {
  cursos: Curso[];
  total: number;
  page: number;
  totalPages: number;
}

const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

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
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [nivel, setNivel] = useState('');
  const [sort, setSort] = useState('reciente');
  const [categorias, setCategorias] = useState<string[]>([]);

  // Categorías para el filtro: se cargan una sola vez, sin filtros, para que
  // no desaparezcan opciones del dropdown al filtrar por categoría/nivel.
  useEffect(() => {
    apiGet<ListadoCursos>('/cursos?limit=100')
      .then(data => setCategorias(Array.from(new Set(data.cursos.map(c => c.categoria).filter(Boolean))) as string[]))
      .catch(() => {});
  }, []);

  const fetchCursos = useCallback(async (paginaAPedir: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoria) params.set('categoria', categoria);
      if (nivel) params.set('nivel', nivel);
      if (sort !== 'reciente') params.set('sort', sort);
      params.set('page', String(paginaAPedir));
      const data = await apiGet<ListadoCursos>(`/cursos?${params.toString()}`);
      setCursos(data.cursos);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search, categoria, nivel, sort]);

  // Cualquier cambio de filtro vuelve a la página 1. Debounce en el texto
  // libre para no disparar una request por cada tecla.
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => fetchCursos(1), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoria, nivel, sort]);

  useEffect(() => {
    fetchCursos(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const irAPagina = (nueva: number) => {
    if (nueva < 1 || nueva > totalPages) return;
    setPage(nueva);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-ink">Cursos Disponibles</h1>

      <div className="card mb-8 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cursos por título o descripción..."
            className="w-full pl-9 pr-3 py-2 bg-white text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="px-3 py-2 bg-white text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={nivel}
          onChange={e => setNivel(e.target.value)}
          className="px-3 py-2 bg-white text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Todos los niveles</option>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-2 bg-white text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
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
          <p className="text-ink-muted">No se encontraron cursos con esos filtros</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso) => (
              <Link key={curso.id} href={`/cursos/${curso.slug}`}>
                <div className="card overflow-hidden p-0 cursor-pointer h-full flex flex-col">
                  <CourseCoverImage imagenUrl={curso.imagenUrl} titulo={curso.titulo} className="w-full aspect-video" />
                  <div className="p-6 flex flex-col flex-1">
                    {(curso.categoria || curso.nivel) && (
                      <div className="flex gap-2 mb-2">
                        {curso.categoria && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {curso.categoria}
                          </span>
                        )}
                        {curso.nivel && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                            {NIVEL_LABEL[curso.nivel] ?? curso.nivel}
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="font-semibold text-lg mb-1 text-ink">{curso.titulo}</h3>
                    {curso.instructorNombre && (
                      <p className="text-ink-soft text-xs mb-2">Por {curso.instructorNombre}</p>
                    )}
                    <p className="text-ink-muted text-sm mb-4 line-clamp-2">{curso.descripcion}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-accent font-bold">${curso.precio} USD</p>
                      {!!curso.alumnosInscriptos && (
                        <span className="flex items-center gap-1 text-xs text-ink-soft">
                          <Users className="w-3.5 h-3.5" />
                          {curso.alumnosInscriptos}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
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
