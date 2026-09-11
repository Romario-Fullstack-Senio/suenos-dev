'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Flame, Trophy, Star, Lock,
  Footprints, Rocket, ShoppingBag, Library, CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

const ICONOS: Record<string, LucideIcon> = {
  Footprints, Rocket, ShoppingBag, Library, CheckCircle2, Flame, Trophy,
};

interface Insignia {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  obtenida: boolean;
}

interface PerfilGamificacion {
  puntos: number;
  leccionesCompletadas: number;
  cursosComprados: number;
  quizzesAprobados: number;
  rachaActual: number;
  rachaMaxima: number;
  insignias: Insignia[];
}

interface RankingItem {
  usuarioId: string;
  nombre: string;
  puntos: number;
}

export default function LogrosPage() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<PerfilGamificacion | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [rankingData] = await Promise.all([
        apiGet<RankingItem[]>('/gamificacion/ranking'),
        user
          ? apiGet<PerfilGamificacion>('/gamificacion/perfil').then(setPerfil).catch(() => {})
          : Promise.resolve(),
      ]);
      setRanking(rankingData);
    } catch {
      // El ranking es público — si falla igual mostramos la página vacía
      // en vez de romperla entera.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cloud-50 flex items-center justify-center">
        <p className="text-ink-muted">Cargando logros...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cloud-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-ink">Logros</h1>
        <p className="text-ink-muted mb-8">Puntos por completar lecciones, aprobar quizzes y avanzar en tus cursos.</p>

        {user ? (
          perfil && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-cloud-100 rounded-xl p-5 shadow-sm border border-ink/[0.07] text-center">
                <Star className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-2xl font-bold text-ink">{perfil.puntos}</p>
                <p className="text-xs text-ink-muted">Puntos</p>
              </div>
              <div className="bg-cloud-100 rounded-xl p-5 shadow-sm border border-ink/[0.07] text-center">
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-ink">{perfil.rachaActual}</p>
                <p className="text-xs text-ink-muted">Racha actual (días)</p>
              </div>
              <div className="bg-cloud-100 rounded-xl p-5 shadow-sm border border-ink/[0.07] text-center">
                <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-ink">{perfil.rachaMaxima}</p>
                <p className="text-xs text-ink-muted">Racha máxima</p>
              </div>
              <div className="bg-cloud-100 rounded-xl p-5 shadow-sm border border-ink/[0.07] text-center">
                <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-ink">{perfil.insignias.filter((i) => i.obtenida).length}/{perfil.insignias.length}</p>
                <p className="text-xs text-ink-muted">Insignias</p>
              </div>
            </div>
          )
        ) : (
          <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] mb-10 text-center">
            <p className="text-ink-muted">Iniciá sesión para ver tu progreso y tus insignias.</p>
          </div>
        )}

        {perfil && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-ink">Insignias</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
              {perfil.insignias.map((insignia) => {
                const Icono = ICONOS[insignia.icono] ?? Trophy;
                return (
                  <div
                    key={insignia.id}
                    className={`rounded-xl p-4 border text-center transition ${
                      insignia.obtenida
                        ? 'bg-cloud-100 border-primary/30 shadow-sm'
                        : 'bg-cloud-50 border-ink/[0.07] opacity-50'
                    }`}
                    title={insignia.descripcion}
                  >
                    <div className="relative w-10 h-10 mx-auto mb-2">
                      <Icono className={`w-10 h-10 ${insignia.obtenida ? 'text-primary' : 'text-ink-soft'}`} />
                      {!insignia.obtenida && (
                        <Lock className="w-4 h-4 text-ink-soft absolute -bottom-1 -right-1 bg-cloud-50 rounded-full p-0.5" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-ink">{insignia.nombre}</p>
                    <p className="text-xs text-ink-muted mt-1">{insignia.descripcion}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h2 className="text-xl font-semibold mb-4 text-ink">Ranking</h2>
        {ranking.length === 0 ? (
          <p className="text-sm text-ink-soft">Todavía no hay puntos registrados en la plataforma.</p>
        ) : (
          <div className="bg-cloud-100 rounded-xl shadow-sm border border-ink/[0.07] divide-y divide-ink/[0.06]">
            {ranking.map((item, i) => (
              <div
                key={item.usuarioId}
                className={`flex items-center justify-between px-5 py-3 ${
                  item.usuarioId === user?.id ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold text-ink-soft">#{i + 1}</span>
                  <span className="text-sm font-medium text-ink">{item.nombre}</span>
                  {item.usuarioId === user?.id && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Vos
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-ink">{item.puntos} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
