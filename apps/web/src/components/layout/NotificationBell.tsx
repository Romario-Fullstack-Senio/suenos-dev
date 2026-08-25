'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPut } from '@/lib/api';
import Link from 'next/link';

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
        className="relative p-2 text-gray-500 hover:text-primary transition"
        aria-label="Notificaciones"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-800">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs text-primary hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-72">
            {cargando ? (
              <div className="p-4 text-center text-gray-400 text-sm">Cargando...</div>
            ) : notificaciones.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Sin notificaciones</div>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition ${
                    !n.leida ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (!n.leida) marcarLeida(n.id);
                    if (n.cursoId) {
                      setAbierta(false);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {!n.leida && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {n.titulo}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{n.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-1">
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
                        className="text-xs text-primary hover:underline flex-shrink-0 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver
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
