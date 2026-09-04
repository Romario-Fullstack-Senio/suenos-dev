'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { apiDelete } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertTriangle } from 'lucide-react';

export function EliminarCuenta() {
  const { logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [eliminando, setEliminando] = useState(false);

  const eliminar = async () => {
    setEliminando(true);
    try {
      await apiDelete('/usuarios/me', { password: password || undefined });
      toast.success('Tu cuenta fue eliminada');
      logout();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la cuenta');
      setEliminando(false);
    }
  };

  return (
    <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-red-500/20">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold text-red-500">Eliminar cuenta</h3>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Borra tu información personal (nombre, email, foto) de forma permanente. No podés deshacer esto ni volver a
        entrar con esta cuenta.
      </p>

      {!abierto ? (
        <Button variant="ghost" onClick={() => setAbierto(true)} className="text-red-500 border border-red-500/30">
          Eliminar mi cuenta
        </Button>
      ) : (
        <div className="space-y-3">
          <Input
            label="Tu contraseña (dejá vacío si entrás con Google/GitHub)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label='Escribí "ELIMINAR" para confirmar'
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={eliminar}
              isLoading={eliminando}
              disabled={eliminando || confirmacion !== 'ELIMINAR'}
            >
              Sí, eliminar mi cuenta
            </Button>
            <Button variant="ghost" onClick={() => setAbierto(false)} disabled={eliminando}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
