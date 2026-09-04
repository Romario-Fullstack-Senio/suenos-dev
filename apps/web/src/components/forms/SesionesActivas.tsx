'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiDelete } from '@/lib/api';
import { Monitor, X } from 'lucide-react';

interface Sesion {
  id: string;
  userAgent: string | null;
  createdAt: string;
  expira: string;
}

/** Traduce el user-agent crudo a algo legible ("Chrome en Windows") sin
 * traer una librería entera de parseo solo para esto — cubre los casos
 * comunes, y si no matchea nada devuelve el string tal cual. */
function describirDispositivo(userAgent: string | null): string {
  if (!userAgent) return 'Dispositivo desconocido';
  const navegador = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'un navegador';
  const so = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS X/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';
  return so ? `${navegador} en ${so}` : navegador;
}

export function SesionesActivas() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await apiGet<Sesion[]>('/auth/sessions');
      setSesiones(data);
    } catch {
      // Silencioso — no es crítico si esta sección no carga.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrarSesion = async (id: string) => {
    setCerrando(id);
    try {
      await apiDelete(`/auth/sessions/${id}`);
      toast.success('Sesión cerrada');
      setSesiones((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cerrar la sesión');
    } finally {
      setCerrando(null);
    }
  };

  if (loading) {
    return <div className="h-20 bg-ink/[0.04] rounded-xl animate-pulse" />;
  }

  if (sesiones.length === 0) return null;

  return (
    <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
      <h3 className="font-semibold mb-1">Sesiones activas</h3>
      <p className="text-sm text-ink-muted mb-4">
        Dispositivos con acceso a tu cuenta ahora mismo. Cerrá cualquiera que no reconozcas.
      </p>
      <ul className="space-y-2">
        {sesiones.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2 border-t border-ink/[0.06] first:border-t-0 first:pt-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Monitor className="w-4 h-4 text-ink-soft flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-ink truncate">{describirDispositivo(s.userAgent)}</p>
                <p className="text-xs text-ink-soft">
                  {new Date(s.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => cerrarSesion(s.id)}
              disabled={cerrando === s.id}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:underline flex-shrink-0 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Cerrar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
