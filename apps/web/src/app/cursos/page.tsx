'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import Link from 'next/link';
import { Search } from 'lucide-react';
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
}

const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [nivel, setNivel] = useState('');
  const [sort, setSort] = useState('reciente');
  const [categorias, setCategorias] = useState<string[]>([]);

  // Categorías para el filtro: se cargan una sola vez, sin filtros, para que
  // no desaparezcan opciones del dropdown al filtrar por categoría/nivel.
  useEffect(() => {
    apiGet<Curso[]>('/cursos')
      .then(data => setCategorias(Array.from(new Set(data.map(c => c.categoria).filter(Boolean))) as string[]))
      .catch(() => {});
  }, []);

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoria) params.set('categoria', categoria);
      if (nivel) params.set('nivel', nivel);
      if (sort !== 'reciente') params.set('sort', sort);
      const qs = params.toString();
      const data = await apiGet<Curso[]>(`/cursos${qs ? `?${qs}` : ''}`);
      setCursos(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search, categoria, nivel, sort]);

  // Debounce del texto libre para no disparar una request por cada tecla.
  useEffect(() => {
    const timeout = setTimeout(fetchCursos, 300);
    return () => clearTimeout(timeout);
  }, [fetchCursos]);

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

      {loading ? (
        <p className="text-ink-muted">Cargando cursos...</p>
      ) : cursos.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">No se encontraron cursos con esos filtros</p>
        </div>
      ) : (
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
                  <h3 className="font-semibold text-lg mb-2 text-ink">{curso.titulo}</h3>
                  <p className="text-ink-muted text-sm mb-4 line-clamp-2">{curso.descripcion}</p>
                  <p className="text-accent font-bold mt-auto">${curso.precio} USD</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
