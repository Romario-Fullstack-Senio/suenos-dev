'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { agregarLeccionSchema, AgregarLeccionFormData } from '@/lib/validations/curso.schema';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UploadCloud, FileVideo, X } from 'lucide-react';

interface LeccionFormProps {
  cursoId: string;
  moduloId: string;
  onLeccionCreated?: () => void;
}

// El video viaja como base64 dentro del JSON (así lo espera POST /videos/upload
// hoy) — 500MB de margen por debajo del límite de 600mb que acepta el server,
// para no reventar la memoria del navegador con archivos gigantes.
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // readAsDataURL produce "data:video/mp4;base64,AAAA..." — el backend
      // solo quiere la parte después de la coma.
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function LeccionForm({ cursoId, moduloId, onLeccionCreated }: LeccionFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AgregarLeccionFormData>({
    resolver: zodResolver(agregarLeccionSchema),
    defaultValues: { orden: 1 },
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subiendoVideo, setSubiendoVideo] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Selecciona un archivo de video');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(`El video supera el límite de ${MAX_VIDEO_BYTES / (1024 * 1024)}MB`);
      e.target.value = '';
      return;
    }
    setVideoFile(file);
  };

  const onSubmit = async (data: AgregarLeccionFormData) => {
    try {
      let videoUrl: string | undefined;
      // Mismo id para el upload de video y la lección creada después — el
      // video queda en MinIO bajo esta key, y el control de acceso a video
      // resuelve la lección por su id real. Generarlos por separado (como
      // antes) dejaba el video sin dueño y rompía la reproducción.
      const leccionId = crypto.randomUUID();

      if (videoFile) {
        setSubiendoVideo(true);
        try {
          const base64 = await fileToBase64(videoFile);
          const result = await apiPost<{ url: string }>('/videos/upload', {
            file: base64,
            leccionId,
          });
          videoUrl = result.url;
        } finally {
          setSubiendoVideo(false);
        }
      }

      await apiPost(`/cursos/${cursoId}/modulos/${moduloId}/lecciones`, { id: leccionId, ...data, videoUrl });
      toast.success('Lección agregada correctamente');
      reset();
      setVideoFile(null);
      onLeccionCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar lección');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] mb-4">
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

      <div className="mb-4">
        <label className="block text-sm font-semibold text-ink-muted mb-1">Video (opcional)</label>
        {videoFile ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 border border-ink/[0.12] rounded-xl bg-cloud-50">
            <span className="flex items-center gap-2 text-sm text-ink truncate">
              <FileVideo className="w-4 h-4 text-primary flex-shrink-0" />
              {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)}MB)
            </span>
            <button
              type="button"
              onClick={() => setVideoFile(null)}
              className="text-ink-soft hover:text-red-500 flex-shrink-0"
              aria-label="Quitar video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 px-3 py-4 border border-dashed border-ink/[0.2] rounded-xl bg-cloud-50 text-sm text-ink-muted cursor-pointer hover:border-primary/50 hover:bg-cloud-100 transition-colors">
            <UploadCloud className="w-4 h-4" />
            Seleccionar video (se transcodifica a HLS automáticamente)
            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>

      <label className="flex items-center gap-2 mb-4 text-sm text-ink-muted cursor-pointer">
        <input type="checkbox" className="rounded border-ink/[0.2]" {...register('esVistaPrevia')} />
        Vista previa gratuita (se puede ver sin comprar el curso)
      </label>

      <div className="w-48 mb-4">
        <Input
          label="Se libera a los (días)"
          type="number"
          min={0}
          placeholder="0 = inmediato"
          error={errors.diasDesdeInscripcion?.message}
          {...register('diasDesdeInscripcion', { valueAsNumber: true })}
        />
        <p className="text-xs text-ink-soft -mt-3">0 = disponible apenas el alumno se inscribe</p>
      </div>

      <Button type="submit" isLoading={isSubmitting || subiendoVideo} disabled={isSubmitting || subiendoVideo}>
        {subiendoVideo ? 'Subiendo y transcodificando…' : 'Agregar Lección'}
      </Button>
      {subiendoVideo && (
        <p className="mt-2 text-xs text-ink-soft">
          Puede tardar varios minutos según el tamaño y duración del video.
        </p>
      )}
    </form>
  );
}
