'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';
import { Captions, UploadCloud, CheckCircle2 } from 'lucide-react';

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

interface SubtitulosUploadProps {
  leccionId: string;
  tieneSubtitulos: boolean;
  onUploaded?: () => void;
}

/** Subida de subtítulos (.vtt) para una lección ya creada — a diferencia del
 * video, que solo se puede subir al crear la lección, esto se puede agregar
 * en cualquier momento después. */
export function SubtitulosUpload({ leccionId, tieneSubtitulos, onUploaded }: SubtitulosUploadProps) {
  const [subiendo, setSubiendo] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.vtt')) {
      toast.error('El archivo debe tener formato .vtt (WebVTT)');
      return;
    }
    setSubiendo(true);
    try {
      const texto = await fileToText(file);
      await apiPost('/videos/upload-subtitulos', { file: texto, leccionId });
      toast.success('Subtítulos subidos correctamente');
      onUploaded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron subir los subtítulos');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-primary cursor-pointer">
      {subiendo ? (
        <>
          <UploadCloud className="w-3.5 h-3.5 animate-pulse" /> Subiendo...
        </>
      ) : tieneSubtitulos ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Subtítulos cargados (reemplazar)
        </>
      ) : (
        <>
          <Captions className="w-3.5 h-3.5" /> Subir subtítulos (.vtt)
        </>
      )}
      <input type="file" accept=".vtt" className="hidden" disabled={subiendo} onChange={handleFile} />
    </label>
  );
}
