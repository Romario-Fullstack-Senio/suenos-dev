'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registroSchema, RegistroFormData } from '@/lib/validations/auth.schema';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function RegistroForm() {
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
  });

  const onSubmit = async (data: RegistroFormData) => {
    try {
      await registerUser(data.nombre, data.email, data.password);
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
    } catch (error) {
      alert('Error al registrar usuario');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Nombre"
          placeholder="Tu nombre"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmar Contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
          Registrarse
        </Button>
      </form>
      <p className="mt-6 text-center text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-primary hover:underline">
          Iniciar Sesión
        </Link>
      </p>
    </div>
  );
}
