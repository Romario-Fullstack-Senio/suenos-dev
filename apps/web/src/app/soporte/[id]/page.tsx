'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, LifeBuoy } from 'lucide-react';

interface Mensaje {
  id: string;
  autorId: string;
  autorNombre: string;
  autorEsAdmin: boolean;
  texto: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  asunto: string;
  categoria: string;
  estado: 'abierto' | 'en_proceso' | 'cerrado';
  createdAt: string;
  mensajes: Mensaje[];
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

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TicketDetallePage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user, hasRole } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Ticket>(`/tickets/${ticketId}`);
      setTicket(data);
    } catch (error) {
      toast.error('No se pudo cargar el ticket');
      router.push('/soporte');
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
    setEnviando(true);
    try {
      await apiPost(`/tickets/${ticketId}/mensajes`, { texto: mensaje.trim() });
      setMensaje('');
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (estado: string) => {
    setCambiandoEstado(true);
    try {
      await apiPatch(`/tickets/${ticketId}/estado`, { estado });
      toast.success('Estado actualizado');
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el estado');
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (loading) return <p className="text-center py-16">Cargando...</p>;
  if (!ticket) return null;

  const esAdmin = hasRole('admin');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={esAdmin ? '/admin/soporte' : '/soporte'} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <LifeBuoy className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="text-2xl font-bold text-ink truncate">{ticket.asunto}</h1>
          </div>
          <p className="text-xs text-ink-soft">
            {esAdmin && `${ticket.usuarioNombre} · `}
            Abierto el {formatFecha(ticket.createdAt)}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1.5 rounded flex-shrink-0 ${ESTADO_STYLES[ticket.estado]}`}>
          {ESTADO_LABELS[ticket.estado]}
        </span>
      </div>

      {esAdmin && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-ink-muted">Cambiar estado:</span>
          {(['abierto', 'en_proceso', 'cerrado'] as const).map((estado) => (
            <button
              key={estado}
              onClick={() => cambiarEstado(estado)}
              disabled={cambiandoEstado || ticket.estado === estado}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition disabled:cursor-default ${
                ticket.estado === estado
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-ink/[0.12] text-ink-muted hover:border-primary/40'
              }`}
            >
              {ESTADO_LABELS[estado]}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {ticket.mensajes.map((m) => {
          const esPropio = m.autorId === user?.id;
          return (
            <div key={m.id} className={`flex ${esPropio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${m.autorEsAdmin ? 'bg-primary/10 border border-primary/20' : 'bg-cloud-100 border border-ink/[0.07]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-ink">{m.autorNombre}</span>
                  {m.autorEsAdmin && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/15 px-1.5 py-0.5 rounded">
                      Soporte
                    </span>
                  )}
                  <span className="text-[11px] text-ink-soft">{formatFecha(m.createdAt)}</span>
                </div>
                <p className="text-sm text-ink-muted whitespace-pre-wrap break-words">{m.texto}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={enviarMensaje} className="flex gap-2">
        <input
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder={ticket.estado === 'cerrado' ? 'Escribí para reabrir el ticket...' : 'Escribí tu mensaje...'}
          maxLength={3000}
          className="flex-1 rounded-xl border border-ink/[0.12] bg-cloud-50 px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <Button type="submit" isLoading={enviando} disabled={enviando || !mensaje.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
