'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { crearCursoSchema, CrearCursoFormData } from '@/lib/validations/curso.schema';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function CursoForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CrearCursoFormData>({
    resolver: zodResolver(crearCursoSchema),
  });

  const onSubmit = async (data: CrearCursoFormData) => {
    if (!user) return;
    try {
      const result = await apiPost<{ id: string }>('/cursos', {
        ...data,
        instructorId: user.id,
      });
      toast.success('Curso creado correctamente');
      router.push(`/instructor/cursos/${result.id}`);
    } catch (error) {
      toast.error('Error al crear curso');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Crear Nuevo Curso</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-suenos-surface rounded-xl p-8 shadow-sm border border-suenos-border">
        <Input
          label="Título del Curso"
          placeholder="Ej: Curso de React"
          error={errors.titulo?.message}
          {...register('titulo')}
        />
        <TextArea
          label="Descripción"
          placeholder="Describe tu curso..."
          rows={4}
          error={errors.descripcion?.message}
          {...register('descripcion')}
        />
        <Input
          label="Precio (USD)"
          type="number"
          step="0.01"
          placeholder="49.99"
          error={errors.precio?.message}
          {...register('precio', { valueAsNumber: true })}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
          Crear Curso
        </Button>
      </form>
    </div>
  );
}
