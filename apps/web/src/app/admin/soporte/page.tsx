'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiGet } from '@/lib/api';
import { LifeBuoy } from 'lucide-react';

interface Ticket {
  id: string;
  usuarioNombre: string;
  asunto: string;
  categoria: string;
  estado: 'abierto' | 'en_proceso' | 'cerrado';
  createdAt: string;
  mensajes: unknown[];
}

const ESTADO_STYLES: Record<string, string> = {
  abierto: 'bg-amber-500/15 text-amber-500',
  en_proceso: 'bg-blue-500/15 text-blue-400',
  cerrado: 'bg-ink/10 text-ink-soft',
};

const ESTADO_LABELS: Record<string, string> = {
  abierto: 'Abierto',
  en_proceso: 'En proceso',
  cerrado: 'Cerrado',
};

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'abierto', label: 'Abiertos' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'cerrado', label: 'Cerrados' },
];

export default function AdminSoportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(async (estado: string) => {
    setLoading(true);
    try {
      const query = estado ? `?estado=${estado}` : '';
      const data = await apiGet<Ticket[]>(`/tickets${query}`);
      setTickets(data);
    } catch (error) {
      toast.error('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(filtro);
  }, [filtro, cargar]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <LifeBuoy className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold text-ink">Tickets de soporte</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition ${
              filtro === f.value ? 'border-primary bg-primary/10 text-primary' : 'border-ink/[0.12] text-ink-muted hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">No hay tickets que coincidan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/soporte/${t.id}`}
              className="card flex items-center justify-between gap-4 hover:shadow-md transition"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-ink">{t.asunto}</span>
                  <span className="text-xs text-ink-soft">· {t.usuarioNombre}</span>
                </div>
                <p className="text-xs text-ink-soft mt-1">
                  {new Date(t.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}
                  {t.mensajes.length} mensaje{t.mensajes.length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded flex-shrink-0 ${ESTADO_STYLES[t.estado]}`}>
                {ESTADO_LABELS[t.estado]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
