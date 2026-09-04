'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useFavoritos } from '@/hooks/useFavoritos';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { WishlistButton } from '@/components/WishlistButton';

interface Curso {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
}

export default function FavoritosPage() {
  const { favoritos, loading: loadingFavoritos } = useFavoritos();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadingFavoritos) return;
    const ids = Array.from(favoritos);
    if (ids.length === 0) {
      setCursos([]);
      setLoading(false);
      return;
    }
    Promise.all(ids.map((id) => apiGet<Curso>(`/cursos/${id}`).catch(() => null)))
      .then((resultados) => setCursos(resultados.filter((c): c is Curso => !!c)))
      .finally(() => setLoading(false));
  }, [favoritos, loadingFavoritos]);

  if (loading) {
    return <p className="text-center py-16 text-ink-muted">Cargando favoritos...</p>;
  }

  if (cursos.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Heart className="w-12 h-12 text-ink-soft mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Todavía no tenés favoritos</h1>
        <p className="text-ink-muted mb-6">Guardá los cursos que te interesen para verlos acá después.</p>
        <Link href="/cursos" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-600 transition">
          Ver cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mis favoritos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cursos.map((curso) => (
          <Link key={curso.id} href={`/cursos/${curso.slug}`}>
            <div className="card overflow-hidden p-0 cursor-pointer h-full flex flex-col relative">
              <WishlistButton
                cursoId={curso.id}
                className="absolute top-3 right-3 z-[1] w-8 h-8 bg-cloud-50/90 backdrop-blur-sm shadow-sm"
              />
              <CourseCoverImage imagenUrl={curso.imagenUrl} titulo={curso.titulo} className="w-full aspect-video" />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-semibold text-lg mb-1 text-ink">{curso.titulo}</h3>
                <p className="text-ink-muted text-sm mb-4 line-clamp-2">{curso.descripcion}</p>
                <p className="text-accent font-bold mt-auto">${curso.precio} USD</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
