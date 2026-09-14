'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Copy } from 'lucide-react';

interface Comision {
  id: string;
  cursoNombre: string;
  monto: number;
  comisionMonto: number;
  estado: string;
  createdAt: string;
}

interface ResumenAfiliado {
  porcentajeComision: number;
  totalGanado: number;
  totalPendiente: number;
  totalPagado: number;
  comisiones: Comision[];
}

export function ProgramaAfiliados() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenAfiliado | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<ResumenAfiliado>('/afiliados/resumen');
      setResumen(data);
    } catch {
      // silencioso: no romper /perfil si esto falla
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const link = typeof window !== 'undefined' && user ? `${window.location.origin}/?ref=${user.id}` : '';

  const copiar = () => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado');
  };

  if (loading || !resumen) return null;

  return (
    <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-ink">Programa de afiliados</h3>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Ganás {resumen.porcentajeComision}% de comisión por cada curso que compre alguien que se registró con tu link.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          readOnly
          value={link}
          className="flex-1 px-3 py-2 bg-cloud-50 text-ink text-sm border border-ink/[0.12] rounded-xl truncate"
        />
        <button
          onClick={copiar}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-on-brand text-sm font-medium rounded-xl hover:bg-primary/90 transition"
        >
          <Copy className="w-4 h-4" /> Copiar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-ink">${resumen.totalGanado.toFixed(2)}</p>
          <p className="text-xs text-ink-muted">Ganado total</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-600">${resumen.totalPendiente.toFixed(2)}</p>
          <p className="text-xs text-ink-muted">Pendiente</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">${resumen.totalPagado.toFixed(2)}</p>
          <p className="text-xs text-ink-muted">Pagado</p>
        </div>
      </div>

      {resumen.comisiones.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {resumen.comisiones.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm px-3 py-2 bg-cloud-50 rounded-lg">
              <div className="min-w-0">
                <p className="text-ink truncate">{c.cursoNombre}</p>
                <p className="text-xs text-ink-soft">{new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="font-semibold text-ink">${c.comisionMonto.toFixed(2)}</p>
                <p className={`text-xs ${c.estado === 'pagada' ? 'text-green-600' : 'text-amber-600'}`}>
                  {c.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
