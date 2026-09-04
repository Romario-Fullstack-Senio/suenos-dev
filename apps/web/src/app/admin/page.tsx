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
        <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
          <h3 className="text-ink-muted text-sm">Usuarios</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.totalUsuarios}</p>
        </div>
        <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
          <h3 className="text-ink-muted text-sm">Cursos</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.totalCursos}</p>
        </div>
        <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
          <h3 className="text-ink-muted text-sm">Inscripciones</h3>
          <p className="text-3xl font-bold">{loading ? '...' : stats.totalInscripciones}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/admin/usuarios" className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] hover:shadow-md transition">
          <h3 className="font-semibold text-lg mb-2">Gestionar Usuarios</h3>
          <p className="text-ink-muted text-sm">Administrar roles y permisos</p>
        </Link>
        <Link href="/admin/cursos" className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] hover:shadow-md transition">
          <h3 className="font-semibold text-lg mb-2">Gestionar Cursos</h3>
          <p className="text-ink-muted text-sm">Ver todos los cursos de la plataforma</p>
        </Link>
        <Link href="/admin/cupones" className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] hover:shadow-md transition">
          <h3 className="font-semibold text-lg mb-2">Gestionar Cupones</h3>
          <p className="text-ink-muted text-sm">Crear y desactivar códigos de descuento</p>
        </Link>
        <Link href="/admin/ordenes" className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] hover:shadow-md transition">
          <h3 className="font-semibold text-lg mb-2">Órdenes</h3>
          <p className="text-ink-muted text-sm">Ver ventas y procesar reembolsos</p>
        </Link>
        <Link href="/admin/resenas" className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] hover:shadow-md transition">
          <h3 className="font-semibold text-lg mb-2">Moderar Reseñas</h3>
          <p className="text-ink-muted text-sm">Ocultar reseñas abusivas o falsas</p>
        </Link>
        <Link href="/admin/soporte" className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] hover:shadow-md transition">
          <h3 className="font-semibold text-lg mb-2">Soporte</h3>
          <p className="text-ink-muted text-sm">Responder tickets de usuarios</p>
        </Link>
      </div>
    </div>
  );
}
