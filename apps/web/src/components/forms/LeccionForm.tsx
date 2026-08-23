'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agregarLeccionSchema, AgregarLeccionFormData } from '@/lib/validations/curso.schema';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface LeccionFormProps {
  cursoId: string;
  moduloId: string;
  onLeccionCreated?: () => void;
}

export function LeccionForm({ cursoId, moduloId, onLeccionCreated }: LeccionFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AgregarLeccionFormData>({
    resolver: zodResolver(agregarLeccionSchema),
    defaultValues: { orden: 1 },
  });

  const onSubmit = async (data: AgregarLeccionFormData) => {
    try {
      await apiPost(`/cursos/${cursoId}/modulos/${moduloId}/lecciones`, data);
      alert('Lección agregada correctamente');
      reset();
      onLeccionCreated?.();
    } catch (error) {
      alert('Error al agregar lección');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl p-6 shadow-sm border mb-4">
      <h3 className="font-semibold mb-4">Agregar Lección</h3>
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            label="Título"
            placeholder="Nombre de la lección"
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
        <div className="w-40">
          <Input
            label="Duración (seg)"
            type="number"
            error={errors.duracionSegundos?.message}
            {...register('duracionSegundos', { valueAsNumber: true })}
          />
        </div>
      </div>
      <Button type="submit" isLoading={isSubmitting}>
        Agregar Lección
      </Button>
    </form>
  );
}
