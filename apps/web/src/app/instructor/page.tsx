'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard del Instructor</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
            <p className="text-sm text-suenos-muted">Mis Cursos</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalCursos}</p>
          </div>
          <div className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
            <p className="text-sm text-suenos-muted">Total Inscripciones</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalInscripciones}</p>
          </div>
          <div className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
            <p className="text-sm text-suenos-muted">Ingresos Estimados</p>
            <p className="text-3xl font-bold text-purple-600">
              ${stats.ingresosEstimados.toLocaleString()} USD
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Mis Cursos</h2>
        <Link href="/instructor/cursos/nuevo">
          <Button>Crear Curso</Button>
        </Link>
      </div>

      {cursos.length === 0 ? (
        <div className="text-center py-16 bg-suenos-surface rounded-xl border border-suenos-border">
          <p className="text-suenos-muted mb-4">No has creado cursos</p>
          <Link href="/instructor/cursos/nuevo">
            <Button>Crear mi primer curso</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
              <h3 className="font-semibold mb-2">{curso.titulo}</h3>
              <p className="text-sm text-suenos-muted mb-1">${curso.precio} USD</p>
              <span className={`text-xs px-2 py-1 rounded ${curso.estado === 'publicado' ? 'bg-green-500/15 text-green-400' : 'bg-suenos-gold/15 text-suenos-gold'}`}>
                {curso.estado}
              </span>
              <div className="mt-4 flex gap-2">
                <Link href={`/instructor/cursos/${curso.id}`} className="text-blue-600 text-sm hover:underline">
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
