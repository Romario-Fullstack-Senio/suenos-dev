'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { crearQuizSchema, CrearQuizFormData } from '@/lib/validations/quiz.schema';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface QuizInstructorFormProps {
  cursoId: string;
}

export function QuizInstructorForm({ cursoId }: QuizInstructorFormProps) {
  const router = useRouter();
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<CrearQuizFormData>({
    resolver: zodResolver(crearQuizSchema),
    defaultValues: {
      cursoId,
      puntajeMinimo: 70,
      preguntas: [{ enunciado: '', opciones: ['', ''], respuestaCorrecta: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'preguntas' });

  const onSubmit = async (data: CrearQuizFormData) => {
    try {
      await apiPost('/quizzes', data);
      toast.success('Quiz creado correctamente');
      router.push(`/instructor/cursos/${cursoId}`);
    } catch (error) {
      toast.error('Error al crear quiz');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
      <h3 className="font-semibold mb-4">Crear Quiz</h3>
      <Input label="Título del Quiz" error={errors.titulo?.message} {...register('titulo')} />
      <Input label="Puntaje Mínimo (%)" type="number" error={errors.puntajeMinimo?.message} {...register('puntajeMinimo', { valueAsNumber: true })} />

      <div className="mt-6">
        <h4 className="font-medium mb-3">Preguntas</h4>
        {fields.map((field, index) => (
          <div key={field.id} className="border border-suenos-border rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Pregunta {index + 1}</span>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(index)} className="text-red-500 text-sm">
                  Eliminar
                </button>
              )}
            </div>
            <Input
              placeholder="Enunciado de la pregunta"
              error={errors.preguntas?.[index]?.enunciado?.message}
              {...register(`preguntas.${index}.enunciado`)}
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input placeholder="Opción 1" {...register(`preguntas.${index}.opciones.0`)} />
              <Input placeholder="Opción 2" {...register(`preguntas.${index}.opciones.1`)} />
            </div>
            <Input
              label="Respuesta correcta (índice)"
              type="number"
              {...register(`preguntas.${index}.respuestaCorrecta`, { valueAsNumber: true })}
            />
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={() => append({ enunciado: '', opciones: ['', ''], respuestaCorrecta: 0 })}>
          + Agregar Pregunta
        </Button>
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
        Crear Quiz
      </Button>
    </form>
  );
}
