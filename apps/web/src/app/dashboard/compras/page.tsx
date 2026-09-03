'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Download, RotateCcw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Orden {
  id: string;
  cursoId: string;
  cursoNombre: string;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'completada' | 'fallida' | 'reembolsada';
  createdAt: string;
}

const ESTADO_STYLE: Record<Orden['estado'], string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  completada: 'bg-green-100 text-green-700',
  fallida: 'bg-red-100 text-red-700',
  reembolsada: 'bg-ink/[0.08] text-ink-muted',
};

const ESTADO_LABEL: Record<Orden['estado'], string> = {
  pendiente: 'Pendiente',
  completada: 'Pagado',
  fallida: 'Fallido',
  reembolsada: 'Reembolsado',
};

const VENTANA_DIAS = 7;

function dentroDeVentana(createdAt: string): boolean {
  const dias = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return dias <= VENTANA_DIAS;
}

export default function MisComprasPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Orden[]>('/ordenes/mias');
      setOrdenes(data);
    } catch (error) {
      toast.error('Error al cargar tus compras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const solicitarReembolso = async (ordenId: string) => {
    if (!confirm('¿Solicitar el reembolso de esta compra? Perderás el acceso al curso.')) return;
    setProcesando(ordenId);
    try {
      await apiPost(`/ordenes/${ordenId}/reembolso`, {});
      toast.success('Reembolso procesado correctamente');
      cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar el reembolso');
    } finally {
      setProcesando(null);
    }
  };

  const descargarFactura = async (ordenId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ordenes/${ordenId}/factura`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo descargar el comprobante');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante-${ordenId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('No se pudo descargar el comprobante');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-ink">Mis Compras</h1>

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : ordenes.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">Todavía no compraste ningún curso</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordenes.map((orden) => (
            <div key={orden.id} className="card flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-ink">{orden.cursoNombre}</p>
                <p className="text-ink-muted text-sm">
                  {new Date(orden.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {' · '}${orden.monto.toFixed(2)} {orden.moneda.toUpperCase()}
                </p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full self-start md:self-center ${ESTADO_STYLE[orden.estado]}`}>
                {ESTADO_LABEL[orden.estado]}
              </span>
              <div className="flex gap-2">
                {orden.estado === 'completada' && (
                  <Button variant="secondary" size="sm" onClick={() => descargarFactura(orden.id)}>
                    <Download className="w-4 h-4 mr-1 inline" /> Comprobante
                  </Button>
                )}
                {orden.estado === 'completada' && dentroDeVentana(orden.createdAt) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => solicitarReembolso(orden.id)}
                    isLoading={procesando === orden.id}
                    disabled={procesando === orden.id}
                  >
                    <RotateCcw className="w-4 h-4 mr-1 inline" /> Reembolsar
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
