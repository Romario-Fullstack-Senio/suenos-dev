'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface Stats {
  totalUsuarios: number;
  totalCursos: number;
  totalInscripciones: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsuarios: 0, totalCursos: 0, totalInscripciones: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiGet<Stats>('/admin/stats');
        setStats(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
          <h3 className="text-suenos-muted text-sm">Usuarios</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.totalUsuarios}</p>
        </div>
        <div className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
          <h3 className="text-suenos-muted text-sm">Cursos</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.totalCursos}</p>
        </div>
        <div className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
          <h3 className="text-suenos-muted text-sm">Inscripciones</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.totalInscripciones}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/usuarios" className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border hover:shadow-md transition">
          <h3 className="font-semibold text-lg mb-2">Gestionar Usuarios</h3>
          <p className="text-suenos-muted text-sm">Administrar roles y permisos</p>
        </Link>
        <Link href="/admin/cursos" className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border hover:shadow-md transition">
          <h3 className="font-semibold text-lg mb-2">Gestionar Cursos</h3>
          <p className="text-suenos-muted text-sm">Ver todos los cursos de la plataforma</p>
        </Link>
      </div>
    </div>
  );
}
