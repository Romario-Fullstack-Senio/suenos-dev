'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { apiPut } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';

export function PreferenciasNotificacion() {
  const { user, updateUser } = useAuth();
  const [guardando, setGuardando] = useState(false);
  // El backend manda esto en /usuarios/me y en el usuario que devuelve el
  // login — si por lo que sea todavía no llegó (usuario viejo antes de
  // esta feature, JWT decodeado sin ese campo), asumimos true: es el
  // default del backend para cuentas nuevas y el estado menos sorpresivo.
  const activo = user?.notificarCursoNuevo ?? true;

  const cambiar = async (valor: boolean) => {
    setGuardando(true);
    try {
      await apiPut('/usuarios/me/preferencias-notificacion', { notificarCursoNuevo: valor });
      updateUser({ notificarCursoNuevo: valor });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la preferencia');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Notificaciones</h3>
      </div>
      <div className="flex items-center justify-between gap-4 mt-3">
        <div>
          <p className="text-sm text-ink">Avisarme de cursos nuevos</p>
          <p className="text-xs text-ink-soft">Email + notificación cuando se publica un curso en la plataforma</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          onClick={() => cambiar(!activo)}
          disabled={guardando}
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            activo ? 'bg-primary' : 'bg-ink/20'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              activo ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
