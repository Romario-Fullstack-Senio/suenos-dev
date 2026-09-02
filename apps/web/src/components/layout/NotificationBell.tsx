'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPut } from '@/lib/api';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  cursoId: string | null;
  leida: boolean;
  fecha: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierta, setAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNoLeidas();
    const interval = setInterval(fetchNoLeidas, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierta(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNoLeidas() {
    if (!user) return;
    try {
      const data = await apiGet<{ count: number }>(`/notificaciones/usuario/${user.id}/no-leidas`);
      setNoLeidas(data.count);
    } catch {}
  }

  async function abrirPanel() {
    if (!user) return;
    const nuevoEstado = !abierta;
    setAbierta(nuevoEstado);

    if (nuevoEstado && notificaciones.length === 0) {
      setCargando(true);
      try {
        const data = await apiGet<Notificacion[]>(`/notificaciones/usuario/${user.id}?limit=10`);
        setNotificaciones(data);
      } catch {}
      setCargando(false);
    }
  }

  async function marcarLeida(id: string) {
    try {
      await apiPut(`/notificaciones/${id}/leer`, {});
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {}
  }

  async function marcarTodasLeidas() {
    if (!user) return;
    try {
      await apiPut(`/notificaciones/usuario/${user.id}/leer-todas`, {});
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {}
  }

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={abrirPanel}
        className="relative p-2 text-suenos-muted hover:text-suenos-text transition-colors rounded-lg hover:bg-suenos-surface"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-suenos-violet text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <div className="absolute right-0 mt-2 w-80 bg-suenos-deep border border-suenos-border rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-suenos-border">
            <h3 className="font-display font-semibold text-sm text-suenos-text">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs text-suenos-cyan hover:text-suenos-cyan-light transition-colors inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-80">
            {cargando ? (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-suenos-violet border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-suenos-dim mx-auto mb-2" />
                <p className="text-sm text-suenos-muted">Sin notificaciones</p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-suenos-border/50 last:border-b-0 cursor-pointer hover:bg-suenos-surface/50 transition-colors ${
                    !n.leida ? 'bg-suenos-violet/5' : ''
                  }`}
                  onClick={() => {
                    if (!n.leida) marcarLeida(n.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {!n.leida && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-suenos-violet flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.leida ? 'font-semibold text-suenos-text' : 'text-suenos-muted'}`}>
                        {n.titulo}
                      </p>
                      <p className="text-xs text-suenos-dim mt-0.5 line-clamp-2">{n.mensaje}</p>
                      <p className="text-xs text-suenos-dim/60 mt-1">
                        {new Date(n.fecha).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {n.cursoId && (
                      <Link
                        href={`/cursos/${n.cursoId}`}
                        className="text-suenos-cyan hover:text-suenos-cyan-light transition-colors flex-shrink-0 mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
