'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { crearCursoSchema, CrearCursoFormData } from '@/lib/validations/curso.schema';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';

// Igual que en LeccionForm.tsx: la imagen viaja como base64 dentro del JSON,
// así lo espera POST /cursos/imagenes/upload hoy.
const MAX_IMAGEN_BYTES = 8 * 1024 * 1024; // 8MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CursoForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CrearCursoFormData>({
    resolver: zodResolver(crearCursoSchema),
  });
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Revoca el object URL anterior cada vez que cambia el archivo (o al
  // desmontar) para no filtrar memoria.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGEN_BYTES) {
      toast.error(`La imagen supera el límite de ${MAX_IMAGEN_BYTES / (1024 * 1024)}MB`);
      e.target.value = '';
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImagenFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const quitarImagen = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImagenFile(null);
    setPreviewUrl(null);
  };

  const onSubmit = async (data: CrearCursoFormData) => {
    if (!user) return;
    try {
      let imagenUrl: string | undefined;

      if (imagenFile) {
        setSubiendoImagen(true);
        try {
          const base64 = await fileToBase64(imagenFile);
          const result = await apiPost<{ url: string }>('/cursos/imagenes/upload', {
            file: base64,
            contentType: imagenFile.type,
          });
          imagenUrl = result.url;
        } finally {
          setSubiendoImagen(false);
        }
      }

      const result = await apiPost<{ id: string }>('/cursos', {
        ...data,
        categoria: data.categoria?.trim() || undefined,
        nivel: data.nivel || undefined,
        imagenUrl,
        instructorId: user.id,
      });
      toast.success('Curso creado correctamente');
      router.push(`/instructor/cursos/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear curso');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Crear Nuevo Curso</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-cloud-100 rounded-xl p-8 shadow-sm border border-ink/[0.07]">
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
        <Input
          label="Categoría (opcional)"
          placeholder="Ej: Programación, Diseño, Marketing..."
          error={errors.categoria?.message}
          {...register('categoria')}
        />
        <Select
          label="Nivel (opcional)"
          error={errors.nivel?.message}
          options={[
            { value: '', label: 'Sin especificar' },
            { value: 'principiante', label: 'Principiante' },
            { value: 'intermedio', label: 'Intermedio' },
            { value: 'avanzado', label: 'Avanzado' },
          ]}
          {...register('nivel')}
        />

        <div className="mb-4">
          <label className="block text-sm font-semibold text-ink-muted mb-1">Imagen de portada (opcional)</label>
          {imagenFile && previewUrl ? (
            <div className="flex items-center gap-3 px-3 py-2 border border-ink/[0.12] rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview local via object URL */}
              <img src={previewUrl} alt="Vista previa" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              <span className="flex-1 text-sm text-ink truncate">
                {imagenFile.name} ({(imagenFile.size / (1024 * 1024)).toFixed(1)}MB)
              </span>
              <button
                type="button"
                onClick={quitarImagen}
                className="text-ink-soft hover:text-red-500 flex-shrink-0"
                aria-label="Quitar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-3 py-4 border border-dashed border-ink/[0.2] rounded-xl bg-white text-sm text-ink-muted cursor-pointer hover:border-primary/50 hover:bg-cloud-100 transition-colors">
              <ImagePlus className="w-4 h-4" />
              Seleccionar imagen de portada
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        <Button type="submit" isLoading={isSubmitting || subiendoImagen} disabled={isSubmitting || subiendoImagen} className="w-full mt-4">
          {subiendoImagen ? 'Subiendo imagen…' : 'Crear Curso'}
        </Button>
      </form>
    </div>
  );
}
