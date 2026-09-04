'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray, UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { crearQuizSchema, CrearQuizFormData, TipoPregunta } from '@/lib/validations/quiz.schema';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface QuizInstructorFormProps {
  cursoId: string;
}

const TIPO_LABEL: Record<TipoPregunta, string> = {
  opcion_unica: 'Opción única',
  verdadero_falso: 'Verdadero / Falso',
  seleccion_multiple: 'Selección múltiple',
};

function PreguntaFields({
  index,
  register,
  setValue,
  watch,
  errors,
  onRemove,
  removible,
}: {
  index: number;
  register: UseFormRegister<CrearQuizFormData>;
  setValue: UseFormSetValue<CrearQuizFormData>;
  watch: UseFormWatch<CrearQuizFormData>;
  errors: FieldErrors<CrearQuizFormData>;
  onRemove: () => void;
  removible: boolean;
}) {
  // `opciones` es un string[] (primitivos, no objetos con id) — useFieldArray
  // exige objetos, así que se maneja a mano con watch/setValue en vez de
  // field-array anidado.
  const opciones: string[] = watch(`preguntas.${index}.opciones`) || [];
  const appendOpcion = () => setValue(`preguntas.${index}.opciones`, [...opciones, '']);
  const removeOpcion = (i: number) => setValue(`preguntas.${index}.opciones`, opciones.filter((_, oi) => oi !== i));

  const tipo = watch(`preguntas.${index}.tipo`);
  const correctas: number[] = watch(`preguntas.${index}.respuestasCorrectas`) || [];
  const esMultiple = tipo === 'seleccion_multiple';

  // Cambiar a Verdadero/Falso fuerza exactamente esas 2 opciones — el
  // dominio (Pregunta.crear) lo exige. Cambiar de V/F a otro tipo no toca
  // las opciones para no perder lo que ya haya escrito el instructor.
  useEffect(() => {
    if (tipo === 'verdadero_falso') {
      setValue(`preguntas.${index}.opciones`, ['Verdadero', 'Falso']);
      setValue(`preguntas.${index}.respuestasCorrectas`, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const toggleCorrecta = (i: number) => {
    if (esMultiple) {
      const yaMarcada = correctas.includes(i);
      setValue(
        `preguntas.${index}.respuestasCorrectas`,
        yaMarcada ? correctas.filter((c) => c !== i) : [...correctas, i],
      );
    } else {
      setValue(`preguntas.${index}.respuestasCorrectas`, [i]);
    }
  };

  return (
    <div className="border border-ink/[0.07] rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-2 gap-2">
        <span className="font-medium">Pregunta {index + 1}</span>
        <div className="flex items-center gap-2">
          <select
            {...register(`preguntas.${index}.tipo`)}
            className="text-sm px-2 py-1.5 bg-cloud-50 text-ink border border-ink/[0.12] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {(Object.keys(TIPO_LABEL) as TipoPregunta[]).map((t) => (
              <option key={t} value={t}>{TIPO_LABEL[t]}</option>
            ))}
          </select>
          {removible && (
            <button type="button" onClick={onRemove} className="text-red-500 text-sm">
              Eliminar
            </button>
          )}
        </div>
      </div>

      <Input
        placeholder="Enunciado de la pregunta"
        error={errors.preguntas?.[index]?.enunciado?.message}
        {...register(`preguntas.${index}.enunciado`)}
      />

      <p className="text-xs text-ink-soft mt-3 mb-1">
        {esMultiple ? 'Marcá una o más respuestas correctas:' : 'Marcá la respuesta correcta:'}
      </p>
      <div className="space-y-2 mb-2">
        {opciones.map((_opcion, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type={esMultiple ? 'checkbox' : 'radio'}
              name={esMultiple ? undefined : `preguntas.${index}.correcta`}
              checked={correctas.includes(i)}
              onChange={() => toggleCorrecta(i)}
              className="flex-shrink-0"
              aria-label={`Opción ${i + 1} es correcta`}
            />
            <input
              type="text"
              placeholder={`Opción ${i + 1}`}
              disabled={tipo === 'verdadero_falso'}
              {...register(`preguntas.${index}.opciones.${i}`)}
              className="flex-1 px-3 py-1.5 bg-cloud-50 text-ink border border-ink/[0.12] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
            />
            {tipo !== 'verdadero_falso' && opciones.length > 2 && (
              <button
                type="button"
                onClick={() => removeOpcion(i)}
                className="text-ink-soft hover:text-red-500 flex-shrink-0"
                aria-label={`Quitar opción ${i + 1}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {tipo !== 'verdadero_falso' && (
        <button
          type="button"
          onClick={appendOpcion}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="w-3 h-3" /> Agregar opción
        </button>
      )}
      {errors.preguntas?.[index]?.respuestasCorrectas?.message && (
        <p className="mt-2 text-sm text-red-500">{errors.preguntas[index]?.respuestasCorrectas?.message}</p>
      )}
    </div>
  );
}

export function QuizInstructorForm({ cursoId }: QuizInstructorFormProps) {
  const router = useRouter();
  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<CrearQuizFormData>({
    resolver: zodResolver(crearQuizSchema),
    defaultValues: {
      cursoId,
      puntajeMinimo: 70,
      preguntas: [{ enunciado: '', tipo: 'opcion_unica', opciones: ['', ''], respuestasCorrectas: [] }],
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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
      <h3 className="font-semibold mb-4">Crear Quiz</h3>
      <Input label="Título del Quiz" error={errors.titulo?.message} {...register('titulo')} />
      <Input label="Puntaje Mínimo (%)" type="number" error={errors.puntajeMinimo?.message} {...register('puntajeMinimo', { valueAsNumber: true })} />

      <div className="mt-6">
        <h4 className="font-medium mb-3">Preguntas</h4>
        {fields.map((field, index) => (
          <PreguntaFields
            key={field.id}
            index={index}
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            onRemove={() => remove(index)}
            removible={fields.length > 1}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() => append({ enunciado: '', tipo: 'opcion_unica', opciones: ['', ''], respuestasCorrectas: [] })}
        >
          + Agregar Pregunta
        </Button>
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
        Crear Quiz
      </Button>
    </form>
  );
}
