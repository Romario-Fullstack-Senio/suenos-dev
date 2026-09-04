'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Favorito {
  cursoId: string;
  createdAt: string;
}

/** A diferencia del carrito (localStorage), favoritos vive en el servidor
 * por usuario — tiene sentido que sobreviva entre dispositivos y no se
 * pierda al limpiar el navegador. */
export function useFavoritos() {
  const { isAuthenticated } = useAuth();
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavoritos = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoritos(new Set());
      setLoading(false);
      return;
    }
    try {
      const data = await apiGet<Favorito[]>('/favoritos');
      setFavoritos(new Set(data.map((f) => f.cursoId)));
    } catch {
      // Silencioso — el corazón simplemente no se muestra marcado.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFavoritos();
  }, [fetchFavoritos]);

  const toggle = async (cursoId: string) => {
    const yaFavorito = favoritos.has(cursoId);
    // Optimista: refleja el cambio antes de la respuesta del servidor.
    setFavoritos((prev) => {
      const next = new Set(prev);
      if (yaFavorito) next.delete(cursoId);
      else next.add(cursoId);
      return next;
    });
    try {
      if (yaFavorito) {
        await apiDelete(`/favoritos/${cursoId}`);
      } else {
        await apiPost(`/favoritos/${cursoId}`, {});
      }
    } catch {
      // Revierte si falló.
      setFavoritos((prev) => {
        const next = new Set(prev);
        if (yaFavorito) next.add(cursoId);
        else next.delete(cursoId);
        return next;
      });
    }
  };

  return { favoritos, isFavorito: (cursoId: string) => favoritos.has(cursoId), toggle, loading };
}
