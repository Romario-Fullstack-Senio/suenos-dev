'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiPut } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Camera } from 'lucide-react';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB — de sobra para una foto de perfil
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // readAsDataURL nos da "data:image/png;base64,AAAA..." — el backend
      // espera el base64 pelado (mismo contrato que /cursos/imagenes/upload).
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AvatarUpload() {
  const { user, updateUser } = useAuth();
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      toast.error('Formato no soportado — usá JPG, PNG, WEBP o GIF');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('La imagen supera el límite de 5MB');
      return;
    }

    setSubiendo(true);
    try {
      const base64 = await fileToBase64(file);
      const { avatarUrl } = await apiPut<{ avatarUrl: string }>('/usuarios/me/avatar', {
        file: base64,
        contentType: file.type,
      });
      updateUser({ avatarUrl });
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir la foto');
    } finally {
      setSubiendo(false);
    }
  };

  const inicial = user?.nombre?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full disabled:opacity-60"
        aria-label="Cambiar foto de perfil"
        title="Cambiar foto de perfil"
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- viene de MinIO/Google/GitHub, no del pipeline de imágenes de Next
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xl font-bold text-white"
            style={{ background: 'linear-gradient(140deg,#8b5cf6,#6366f1)' }}
          >
            {inicial}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
        >
          {subiendo ? 'Subiendo…' : 'Cambiar foto'}
        </button>
        <p className="text-xs text-ink-soft mt-0.5">JPG, PNG, WEBP o GIF · máx. 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={subiendo} onChange={handleFile} />
    </div>
  );
}
