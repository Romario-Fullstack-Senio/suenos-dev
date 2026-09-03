'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations/auth.schema';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [listo, setListo] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 card text-center">
        <h1 className="text-2xl font-bold mb-4 text-ink">Enlace inválido</h1>
        <p className="text-ink-muted">Falta el token de recuperación en el enlace.</p>
        <Link href="/auth/forgot-password" className="inline-block mt-6 text-secondary hover:underline">
          Solicitar uno nuevo
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await apiPost('/auth/reset-password', { token, password: data.password });
      setListo(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'El enlace no es válido o ya expiró');
    }
  };

  if (listo) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 card text-center">
        <h1 className="text-2xl font-bold mb-4 text-ink">¡Listo!</h1>
        <p className="text-ink-muted">Tu contraseña se actualizó correctamente. Redirigiendo al login…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 card">
      <h1 className="text-2xl font-bold mb-6 text-center text-ink">Elegir nueva contraseña</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Nueva contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
          Guardar nueva contraseña
        </Button>
      </form>
    </div>
  );
}
