'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { perfilSchema, PerfilFormData } from '@/lib/validations/perfil.schema';
import { useAuth } from '@/contexts/AuthContext';
import { apiPut } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function PerfilForm() {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: user?.nombre || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: PerfilFormData) => {
    try {
      await apiPut('/usuarios/me', data);
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error('Error al actualizar perfil');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-suenos-surface rounded-xl shadow-sm border border-suenos-border">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
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
