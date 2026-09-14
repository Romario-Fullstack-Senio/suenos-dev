'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Pin, Lock } from 'lucide-react';
import { SkeletonList } from '@/components/ui/SkeletonGrid';

const CATEGORIAS: { value: string; label: string }[] = [
  { value: '', label: 'Todas las categorías' },
  { value: 'general', label: 'General' },
  { value: 'ayuda', label: 'Ayuda' },
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'anuncios', label: 'Anuncios' },
  { value: 'sugerencias', label: 'Sugerencias' },
];

interface Tema {
  id: string;
  autorNombre: string;
  titulo: string;
  categoria: string;
  fijado: boolean;
  cerrado: boolean;
  createdAt: string;
  totalRespuestas: number;
}

export default function ComunidadPage() {
  const { isAuthenticated } = useAuth();
  const [temas, setTemas] = useState<Tema[]>([]);
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const query = categoria ? `?categoria=${categoria}` : '';
      const data = await apiGet<Tema[]>(`/foro/temas${query}`);
      setTemas(data);
    } catch {
      setTemas([]);
    } finally {
      setLoading(false);
    }
  }, [categoria]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">Comunidad</h1>
          <p className="text-ink-muted text-sm mt-1">Un espacio para charlar con otros estudiantes, más allá de las preguntas de cada lección.</p>
        </div>
        {isAuthenticated && (
          <Link href="/comunidad/nuevo">
            <Button>Nuevo tema</Button>
          </Link>
        )}
      </div>

      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="mb-6 px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {CATEGORIAS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {loading ? (
        <SkeletonList />
      ) : temas.length === 0 ? (
        <div className="text-center py-16 card">
          <MessageSquare className="w-8 h-8 text-ink-soft mx-auto mb-2" />
          <p className="text-ink-muted">Todavía no hay temas{categoria ? ' en esta categoría' : ''}. ¡Empezá vos!</p>
        </div>
      ) : (
        <div className="bg-cloud-100 rounded-xl shadow-sm border border-ink/[0.07] divide-y divide-ink/[0.06]">
          {temas.map((t) => (
            <Link
              key={t.id}
              href={`/comunidad/${t.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cloud-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.fijado && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  {t.cerrado && <Lock className="w-3.5 h-3.5 text-ink-soft flex-shrink-0" />}
                  <span className="font-medium text-ink truncate">{t.titulo}</span>
                </div>
                <p className="text-xs text-ink-soft mt-1">
                  {t.autorNombre} · {new Date(t.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ·{' '}
                  <span className="capitalize">{t.categoria}</span>
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs text-ink-muted flex-shrink-0">
                <MessageSquare className="w-3.5 h-3.5" /> {t.totalRespuestas}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
