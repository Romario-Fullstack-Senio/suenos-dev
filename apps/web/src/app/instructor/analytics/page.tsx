'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface IngresoPorDia {
  fecha: string;
  monto: number;
}

interface VentaPorCurso {
  cursoId: string;
  cursoNombre: string;
  ventas: number;
  ingresos: number;
}

interface FinalizacionPorCurso {
  cursoId: string;
  cursoNombre: string;
  inscriptos: number;
  completaron: number;
  tasa: number;
}

interface Analytics {
  ingresosPorDia: IngresoPorDia[];
  ventasPorCurso: VentaPorCurso[];
  tasaFinalizacionPorCurso: FinalizacionPorCurso[];
}

function GraficoIngresos({ datos }: { datos: IngresoPorDia[] }) {
  const max = Math.max(...datos.map(d => d.monto), 1);
  const width = 700;
  const height = 160;
  const barWidth = width / datos.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
      {datos.map((d, i) => {
        const barHeight = (d.monto / max) * (height - 20);
        return (
          <g key={d.fecha}>
            <rect
              x={i * barWidth + 1}
              y={height - barHeight - 20}
              width={barWidth - 2}
              height={barHeight}
              rx={2}
              fill="#6366f1"
              fillOpacity={d.monto > 0 ? 0.85 : 0.1}
            >
              <title>{`${d.fecha}: $${d.monto.toFixed(2)}`}</title>
            </rect>
          </g>
        );
      })}
      <line x1={0} y1={height - 20} x2={width} y2={height - 20} stroke="#e2e8f0" strokeWidth={1} />
    </svg>
  );
}

export default function InstructorAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiGet<Analytics>(`/instructor/analytics/${user.id}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-ink-muted">Cargando...</p>
      </div>
    );
  }

  const totalIngresos30d = data?.ingresosPorDia.reduce((sum, d) => sum + d.monto, 0) ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-ink">Analítica</h1>
        <Link href="/instructor" className="text-secondary hover:underline text-sm">
          ← Volver al panel
        </Link>
      </div>

      <div className="card mb-8">
        <h2 className="font-semibold text-lg text-ink mb-1">Ingresos — últimos 30 días</h2>
        <p className="text-2xl font-bold text-secondary mb-4">${totalIngresos30d.toFixed(2)} USD</p>
        {data && <GraficoIngresos datos={data.ingresosPorDia} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-lg text-ink mb-4">Ventas por curso</h2>
          {!data || data.ventasPorCurso.length === 0 ? (
            <p className="text-ink-muted text-sm">Sin ventas todavía</p>
          ) : (
            <div className="space-y-3">
              {data.ventasPorCurso.map((v) => (
                <div key={v.cursoId} className="flex items-center justify-between text-sm">
                  <span className="text-ink truncate pr-2">{v.cursoNombre}</span>
                  <span className="text-ink-muted flex-shrink-0">{v.ventas} ventas · ${v.ingresos.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-lg text-ink mb-4">Tasa de finalización</h2>
          {!data || data.tasaFinalizacionPorCurso.length === 0 ? (
            <p className="text-ink-muted text-sm">Sin inscripciones todavía</p>
          ) : (
            <div className="space-y-4">
              {data.tasaFinalizacionPorCurso.map((f) => (
                <div key={f.cursoId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink truncate pr-2">{f.cursoNombre}</span>
                    <span className="text-ink-muted flex-shrink-0">
                      {f.completaron}/{f.inscriptos} ({f.tasa}%)
                    </span>
                  </div>
                  <div className="h-2 bg-ink/[0.07] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${f.tasa}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
