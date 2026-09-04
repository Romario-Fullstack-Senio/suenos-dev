'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { perfilSchema, PerfilFormData } from '@/lib/validations/perfil.schema';
import { useAuth } from '@/contexts/AuthContext';
import { apiPut, apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AvatarUpload } from './AvatarUpload';
import { MailWarning } from 'lucide-react';

export function PerfilForm() {
  const { user, updateUser } = useAuth();
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: user?.nombre || '',
      email: user?.email || '',
    },
  });

  // `user` llega async (AuthContext lo carga de localStorage en un
  // useEffect) — en el primer render todavía es null, así que
  // defaultValues arranca vacío y react-hook-form no lo vuelve a leer
  // solo. Sin este reset() el formulario quedaba en blanco para siempre y
  // "Guardar Cambios" mandaba un nombre vacío (rechazado por el schema).
  useEffect(() => {
    if (user) {
      reset({ nombre: user.nombre, email: user.email });
    }
  }, [user, reset]);

  const onSubmit = async (data: PerfilFormData) => {
    try {
      // El backend devuelve el usuario post-guardado (no lo que mandamos) —
      // si cambió el email, emailVerificado vuelve a false del lado del
      // servidor, y necesitamos ESE valor para que el banner de "verificá
      // tu email" reaparezca sin esperar a un refresh de página.
      const { usuario } = await apiPut<{ usuario?: typeof data & { emailVerificado: boolean } }>('/usuarios/me', data);
      if (usuario) updateUser(usuario);
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar perfil');
    }
  };

  const reenviarVerificacion = async () => {
    if (!user) return;
    setReenviando(true);
    try {
      await apiPost('/auth/resend-verification', { email: user.email });
      setReenviado(true);
    } catch (error) {
      toast.error('Error al reenviar el email');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-cloud-100 rounded-xl shadow-sm border border-ink/[0.07]">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      <div className="mb-6">
        <AvatarUpload />
      </div>
      {user && !user.emailVerificado && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <MailWarning className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Tu email todavía no está verificado</p>
            {reenviado ? (
              <p className="text-sm text-amber-700 mt-1">Te enviamos un nuevo enlace, revisá tu bandeja.</p>
            ) : (
              <button
                type="button"
                onClick={reenviarVerificacion}
                disabled={reenviando}
                className="text-sm text-amber-800 underline hover:no-underline mt-1 disabled:opacity-50"
              >
                {reenviando ? 'Enviando…' : 'Reenviar email de verificación'}
              </button>
            )}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Nombre"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
          Guardar Cambios
        </Button>
      </form>
    </div>
  );
}
