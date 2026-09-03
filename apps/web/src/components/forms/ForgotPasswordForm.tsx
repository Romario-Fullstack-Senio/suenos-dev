'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations/auth.schema';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [enviado, setEnviado] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await apiPost('/auth/forgot-password', data);
      setEnviado(true);
    } catch (error) {
      toast.error('Ocurrió un error, intentá de nuevo');
    }
  };

  if (enviado) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 card text-center">
        <h1 className="text-2xl font-bold mb-4 text-ink">Revisá tu email</h1>
        <p className="text-ink-muted">
          Si ese email está registrado, te enviamos un enlace para restablecer tu contraseña. Puede tardar
          unos minutos en llegar.
        </p>
        <Link href="/auth/login" className="inline-block mt-6 text-secondary hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 card">
      <h1 className="text-2xl font-bold mb-2 text-center text-ink">Recuperar contraseña</h1>
      <p className="text-ink-muted text-sm text-center mb-6">
        Ingresá tu email y te mandamos un enlace para elegir una nueva contraseña.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
          Enviar enlace
        </Button>
      </form>
      <p className="mt-6 text-center text-ink-muted">
        <Link href="/auth/login" className="text-secondary hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
