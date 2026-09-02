'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { agregarModuloSchema, AgregarModuloFormData } from '@/lib/validations/curso.schema';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ModuloFormProps {
  cursoId: string;
  onModuloCreated?: () => void;
}

export function ModuloForm({ cursoId, onModuloCreated }: ModuloFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AgregarModuloFormData>({
    resolver: zodResolver(agregarModuloSchema),
    defaultValues: { orden: 1 },
  });

  const onSubmit = async (data: AgregarModuloFormData) => {
    try {
      await apiPost(`/cursos/${cursoId}/modulos`, data);
      toast.success('Módulo agregado correctamente');
      reset();
      onModuloCreated?.();
    } catch (error) {
      toast.error('Error al agregar módulo');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border mb-4">
      <h3 className="font-semibold mb-4">Agregar Módulo</h3>
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            label="Título"
            placeholder="Nombre del módulo"
            error={errors.titulo?.message}
            {...register('titulo')}
          />
        </div>
        <div className="w-32">
          <Input
            label="Orden"
            type="number"
            error={errors.orden?.message}
            {...register('orden', { valueAsNumber: true })}
          />
        </div>
      </div>
      <Button type="submit" isLoading={isSubmitting}>
        Agregar Módulo
      </Button>
    </form>
  );
}
