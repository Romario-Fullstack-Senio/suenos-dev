'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { LifeBuoy, Plus, X } from 'lucide-react';

interface Ticket {
  id: string;
  asunto: string;
  categoria: string;
  estado: 'abierto' | 'en_proceso' | 'cerrado';
  createdAt: string;
  usuarioNombre: string;
  mensajes: { texto: string }[];
}

const CATEGORIAS = [
  { value: 'cuenta', label: 'Mi cuenta' },
  { value: 'pagos', label: 'Pagos y facturación' },
  { value: 'curso', label: 'Un curso' },
  { value: 'tecnico', label: 'Problema técnico' },
  { value: 'otro', label: 'Otro' },
];

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

export default function SoportePage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [categoria, setCategoria] = useState('otro');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Ticket[]>('/tickets/mios');
      setTickets(data);
    } catch (error) {
      toast.error('Error al cargar tus tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crearTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto.trim() || !texto.trim()) return;
    setEnviando(true);
    try {
      const nuevo = await apiPost<Ticket>('/tickets', { asunto: asunto.trim(), categoria, texto: texto.trim() });
      toast.success('Ticket creado');
      router.push(`/soporte/${nuevo.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el ticket');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-ink">Soporte</h1>
        </div>
        <div className="flex items-center gap-3">
          {hasRole('admin') && (
            <Link href="/admin/soporte" className="text-sm font-medium text-primary hover:underline">
              Ver todos los tickets →
            </Link>
          )}
          <Button onClick={() => setMostrarForm((v) => !v)} size="sm">
            {mostrarForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {mostrarForm ? 'Cancelar' : 'Nuevo ticket'}
          </Button>
        </div>
      </div>

      {mostrarForm && (
        <form onSubmit={crearTicket} className="card mb-6 space-y-1">
          <Input label="Asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} maxLength={200} required />
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-muted mb-1.5">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <TextArea
            label="Contanos qué pasó"
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={3000}
            required
          />
          <Button type="submit" isLoading={enviando} disabled={enviando || !asunto.trim() || !texto.trim()} className="w-full mt-2">
            Enviar ticket
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 card">
          <LifeBuoy className="w-10 h-10 text-ink-soft mx-auto mb-3" />
          <p className="text-ink-muted">Todavía no abriste ningún ticket de soporte.</p>
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
                <p className="font-medium text-ink truncate">{t.asunto}</p>
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
