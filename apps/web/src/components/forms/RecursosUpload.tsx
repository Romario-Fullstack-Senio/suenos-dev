'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { apiPost, apiDelete } from '@/lib/api';
import { FileDown, UploadCloud, X } from 'lucide-react';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const MAX_RECURSO_BYTES = 50 * 1024 * 1024; // 50MB — de sobra para PDFs/zips de apuntes, sin abrir la puerta a subir algo enorme por acá

interface RecursoLeccion {
  nombre: string;
  archivo: string;
  url: string;
}

interface RecursosUploadProps {
  leccionId: string;
  recursos: RecursoLeccion[];
  onChange: () => void;
}

export function RecursosUpload({ leccionId, recursos, onChange }: RecursosUploadProps) {
  const [subiendo, setSubiendo] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_RECURSO_BYTES) {
      toast.error(`El archivo supera el límite de ${MAX_RECURSO_BYTES / (1024 * 1024)}MB`);
      return;
    }
    setSubiendo(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await apiPost('/videos/upload-recurso', {
        file: dataUrl,
        leccionId,
        nombre: file.name,
        nombreArchivo: file.name,
      });
      toast.success('Recurso subido correctamente');
      onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el recurso');
    } finally {
      setSubiendo(false);
    }
  };

  const eliminar = async (archivo: string) => {
    setEliminando(archivo);
    try {
      await apiDelete(`/videos/recursos/${leccionId}/${encodeURIComponent(archivo)}`);
      toast.success('Recurso eliminado');
      onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el recurso');
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="mt-2">
      {recursos.length > 0 && (
        <ul className="space-y-1 mb-2">
          {recursos.map((r) => (
            <li key={r.archivo} className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-ink-muted truncate">
                <FileDown className="w-3.5 h-3.5 flex-shrink-0" /> {r.nombre}
              </span>
              <button
                type="button"
                onClick={() => eliminar(r.archivo)}
                disabled={eliminando === r.archivo}
                className="text-ink-soft hover:text-red-500 flex-shrink-0 disabled:opacity-50"
                aria-label={`Quitar ${r.nombre}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-primary cursor-pointer">
        {subiendo ? (
          <>
            <UploadCloud className="w-3.5 h-3.5 animate-pulse" /> Subiendo...
          </>
        ) : (
          <>
            <UploadCloud className="w-3.5 h-3.5" /> Subir recurso (PDF, zip...)
          </>
        )}
        <input type="file" className="hidden" disabled={subiendo} onChange={handleFile} />
      </label>
    </div>
  );
}
