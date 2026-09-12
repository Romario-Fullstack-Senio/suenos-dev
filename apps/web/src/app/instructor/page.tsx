'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BookOpen } from 'lucide-react';
import { EstadoCursoBadge } from '@/components/ui/Badge';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { SkeletonGrid } from '@/components/ui/SkeletonGrid';
import { formatearPrecio } from '@/lib/format';

interface Curso {
  id: string;
  titulo: string;
  slug: string;
  estado: string;
  precio: number;
}

interface InstructorStats {
  totalCursos: number;
  totalInscripciones: number;
  ingresosEstimados: number;
}

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [cursosData, statsData] = await Promise.all([
          apiGet<Curso[]>(`/cursos?instructorId=${user.id}`),
          apiGet<InstructorStats>(`/instructor/stats/${user.id}`),
        ]);
        setCursos(cursosData);
        setStats(statsData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-9 w-80 bg-ink/[0.06] rounded mb-8 animate-pulse" />
        <SkeletonGrid cantidad={3} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard del Instructor</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
            <p className="text-sm text-ink-muted">Mis Cursos</p>
            <p className="text-3xl font-extrabold text-ink">{stats.totalCursos}</p>
          </div>
          <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
            <p className="text-sm text-ink-muted">Total Inscripciones</p>
            <p className="text-3xl font-extrabold text-ink">{stats.totalInscripciones}</p>
          </div>
          <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
            <p className="text-sm text-ink-muted">Ingresos Estimados</p>
            <p className="text-3xl font-extrabold text-ink">
              {formatearPrecio(stats.ingresosEstimados)}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Mis Cursos</h2>
        <div className="flex gap-3">
          <Link href="/instructor/analytics" className="text-secondary hover:underline text-sm self-center">
            Ver analítica →
          </Link>
          <Link href="/instructor/cursos/nuevo">
            <Button>Crear Curso</Button>
          </Link>
        </div>
      </div>

      {cursos.length === 0 ? (
        <EstadoVacio
          icono={BookOpen}
          titulo="Todavía no creaste ningún curso"
          texto="Publicá tu primer curso para empezar a recibir inscripciones."
          cta={{ href: '/instructor/cursos/nuevo', label: 'Crear mi primer curso' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
              <h3 className="font-semibold mb-2">{curso.titulo}</h3>
              <p className="text-sm text-ink-muted mb-2">{formatearPrecio(curso.precio)}</p>
              <EstadoCursoBadge estado={curso.estado} />
              <div className="mt-4 flex gap-2">
                <Link href={`/instructor/cursos/${curso.id}`} className="text-sm font-semibold hover:underline">
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
