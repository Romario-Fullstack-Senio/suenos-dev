'use client';

import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoritos } from '@/hooks/useFavoritos';

export function WishlistButton({ cursoId, className = '' }: { cursoId: string; className?: string }) {
  const { isAuthenticated } = useAuth();
  const { isFavorito, toggle } = useFavoritos();
  const activo = isFavorito(cursoId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // el botón suele vivir dentro de un <Link> a la card del curso
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Iniciá sesión para guardar cursos en tu lista de favoritos');
      return;
    }
    toggle(cursoId);
    toast.success(activo ? 'Quitado de favoritos' : 'Agregado a favoritos');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={activo ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-pressed={activo}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${
        activo ? 'text-red-500' : 'text-ink-soft hover:text-red-500'
      } ${className}`}
    >
      <Heart className="w-5 h-5" fill={activo ? 'currentColor' : 'none'} />
    </button>
  );
}
