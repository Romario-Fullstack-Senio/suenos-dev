'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPatch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/SkeletonGrid';

interface Comision {
  id: string;
  afiliadoNombre: string;
  referidoNombre: string;
  cursoNombre: string;
  monto: number;
  comisionMonto: number;
  estado: string;
  createdAt: string;
}

export default function AdminAfiliadosPage() {
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(true);
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [pagando, setPagando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Comision[]>('/afiliados/comisiones');
      setComisiones(data);
    } catch {
      toast.error('Error al cargar las comisiones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pagar = async (id: string) => {
    setPagando(id);
    try {
      await apiPatch(`/afiliados/comisiones/${id}/pagar`, {});
      toast.success('Comisión marcada como pagada');
      setComisiones((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'pagada' } : c)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al pagar');
    } finally {
      setPagando(null);
    }
  };

  const filtradas = comisiones.filter((c) => !soloPendientes || c.estado === 'pendiente');
  const totalPendiente = comisiones.filter((c) => c.estado === 'pendiente').reduce((sum, c) => sum + c.comisionMonto, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-ink">Comisiones de afiliados</h1>
      <p className="text-sm text-ink-muted mb-6">
        Total pendiente de pago: <span className="font-semibold text-ink">${totalPendiente.toFixed(2)}</span>
      </p>

      <label className="flex items-center gap-2 mb-6 text-sm text-ink-muted cursor-pointer w-fit">
        <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} className="rounded border-ink/[0.2]" />
        Mostrar solo pendientes
      </label>

      {loading ? (
        <SkeletonTable />
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">No hay comisiones{soloPendientes ? ' pendientes' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((c) => (
            <div key={c.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{c.afiliadoNombre} <span className="text-ink-soft font-normal">refirió a</span> {c.referidoNombre}</p>
                <p className="text-sm text-ink-muted">{c.cursoNombre} — ${c.monto} USD</p>
                <p className="text-xs text-ink-soft mt-1">
                  {new Date(c.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-ink mb-2">${c.comisionMonto.toFixed(2)}</p>
                {c.estado === 'pagada' ? (
                  <span className="text-xs font-semibold text-green-600">Pagada</span>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => pagar(c.id)} isLoading={pagando === c.id} disabled={pagando === c.id}>
                    Marcar pagada
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
