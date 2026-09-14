'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Download, RotateCcw, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { SkeletonList } from '@/components/ui/SkeletonGrid';
import { formatearFecha, formatearPrecio } from '@/lib/format';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface OrdenItem {
  cursoId: string;
  cursoNombre: string;
  precio: number;
}

interface Orden {
  id: string;
  items: OrdenItem[];
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'completada' | 'fallida' | 'reembolsada';
  createdAt: string;
}

// Tonos semánticos (con valor propio por tema) en lugar de los bg-*-100 /
// text-*-700 fijos de Tailwind, que en tema oscuro quedaban como parches
// claros sobre fondo oscuro.
const ESTADO_TONO: Record<Orden['estado'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  pendiente: 'warning',
  completada: 'success',
  fallida: 'danger',
  reembolsada: 'neutral',
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
        <SkeletonList cantidad={3} />
      ) : ordenes.length === 0 ? (
        <EstadoVacio
          icono={Receipt}
          titulo="Todavía no compraste ningún curso"
          texto="Cuando completes una compra vas a ver acá el comprobante y el detalle."
          cta={{ href: '/cursos', label: 'Ver cursos' }}
        />
      ) : (
        <div className="space-y-4">
          {ordenes.map((orden) => (
            <div key={orden.id} className="card flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-ink">
                  {orden.items.map(i => i.cursoNombre).join(', ')}
                </p>
                <p className="text-ink-muted text-sm">
                  {formatearFecha(orden.createdAt)}
                  {' · '}{formatearPrecio(orden.monto)}
                  {orden.items.length > 1 && ` · ${orden.items.length} cursos`}
                </p>
              </div>
              <Badge tono={ESTADO_TONO[orden.estado]} className="self-start md:self-center">
                {ESTADO_LABEL[orden.estado]}
              </Badge>
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
