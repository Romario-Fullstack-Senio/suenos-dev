'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/SkeletonGrid';
import { Badge } from '@/components/ui/Badge';
import { formatearPrecio } from '@/lib/format';

interface OrdenItem {
  cursoId: string;
  cursoNombre: string;
  precio: number;
}

interface Orden {
  id: string;
  items: OrdenItem[];
  estudianteNombre: string;
  estudianteEmail: string;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'completada' | 'fallida' | 'reembolsada';
  createdAt: string;
}

const ESTADO_TONO: Record<Orden['estado'], 'warning' | 'success' | 'danger' | 'neutral'> = {
  pendiente: 'warning',
  completada: 'success',
  fallida: 'danger',
  reembolsada: 'neutral',
};

export default function AdminOrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Orden[]>('/ordenes');
      setOrdenes(data);
    } catch (error) {
      toast.error('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const reembolsar = async (ordenId: string) => {
    if (!confirm('¿Reembolsar esta orden? El alumno perderá el acceso al curso.')) return;
    setProcesando(ordenId);
    try {
      await apiPost(`/ordenes/${ordenId}/reembolso`, {});
      toast.success('Reembolso procesado');
      cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al reembolsar');
    } finally {
      setProcesando(null);
    }
  };

  const filtradas = ordenes.filter(o =>
    !busqueda ||
    o.estudianteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.estudianteEmail.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.items.some(i => i.cursoNombre.toLowerCase().includes(busqueda.toLowerCase())),
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-ink">Órdenes</h1>

      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por alumno, email o curso..."
        className="w-full mb-6 px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      {loading ? (
        <SkeletonTable />
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">No hay órdenes que coincidan</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cloud-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Alumno</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Curso</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Monto</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.07]">
              {filtradas.map((orden) => (
                <tr key={orden.id}>
                  <td className="px-6 py-4">
                    <p className="text-ink font-medium">{orden.estudianteNombre}</p>
                    <p className="text-ink-soft text-xs">{orden.estudianteEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-ink-muted">
                    {orden.items.map(i => i.cursoNombre).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-ink-muted">{formatearPrecio(orden.monto)}</td>
                  <td className="px-6 py-4 text-ink-muted text-sm">
                    {new Date(orden.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4">
                    <Badge tono={ESTADO_TONO[orden.estado]}>
                      {orden.estado}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {orden.estado === 'completada' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => reembolsar(orden.id)}
                        isLoading={procesando === orden.id}
                        disabled={procesando === orden.id}
                      >
                        Reembolsar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
