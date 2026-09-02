'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import Link from 'next/link';

interface Inscripcion {
  id: string;
  cursoId?: string;
  props?: {
    estudianteId: string;
    cursoId: string;
    fechaInscripcion: string;
    activa: boolean;
  };
  fechaInscripcion?: string;
  activa?: boolean;
}

interface Curso {
  id: string;
  titulo: string;
  slug: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const ordenId = searchParams.get('ordenId');
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [cursosMap, setCursosMap] = useState<Record<string, Curso>>({});
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!user) return;

    const confirmAndFetch = async () => {
      try {
        if (ordenId) {
          setConfirming(true);
          await apiPost(`/ordenes/${ordenId}/confirm`, {});
          setConfirming(false);
        }

        const data = await apiGet<Inscripcion[]>(`/inscripciones/estudiante/${user.id}`);

        const normalized = data.map(i => ({
          ...i,
          cursoId: i.cursoId || i.props?.cursoId || '',
          fechaInscripcion: i.fechaInscripcion || i.props?.fechaInscripcion || '',
          activa: i.activa ?? i.props?.activa ?? true,
        }));
        setInscripciones(normalized);

        const cursoIds = Array.from(new Set(normalized.map(i => i.cursoId)));
        const cursos: Curso[] = await apiGet<Curso[]>('/cursos');
        const map: Record<string, Curso> = {};
        cursos.filter(c => cursoIds.includes(c.id)).forEach(c => { map[c.id] = c; });
        setCursosMap(map);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    confirmAndFetch();
  }, [user, ordenId]);

  if (!user) {
    return <div className="text-center py-16">Debes iniciar sesión</div>;
  }

  if (confirming) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-suenos-muted">Confirmando pago y activando acceso...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mis Cursos</h1>
      {loading ? (
        <p>Cargando...</p>
      ) : inscripciones.length === 0 ? (
        <div className="text-center py-16 bg-suenos-surface rounded-xl border border-suenos-border">
          <p className="text-suenos-muted mb-4">No tienes cursos inscritos</p>
          <Link href="/cursos" className="text-suenos-violet-light hover:underline">
            Explorar cursos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inscripciones.map((insc) => {
            const curso = insc.cursoId ? cursosMap[insc.cursoId] : undefined;
            return (
              <div key={insc.id} className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
                <h3 className="font-semibold mb-2">
                  {curso?.titulo || `Curso ${insc.cursoId?.slice(0, 8)}...`}
                </h3>
                <p className="text-sm text-suenos-muted mb-4">
                  Inscrito: {insc.fechaInscripcion ? new Date(insc.fechaInscripcion).toLocaleDateString() : 'N/A'}
                </p>
                <Link
                  href={`/aprender/${insc.cursoId}`}
                  className="block text-center bg-suenos-violet text-white py-2 rounded-lg hover:bg-suenos-violet/90 transition"
                >
                  Continuar
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
