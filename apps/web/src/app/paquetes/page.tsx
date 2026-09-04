'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { Package } from 'lucide-react';

interface Paquete {
  id: string;
  titulo: string;
  descripcion: string;
  cursos: { id: string; titulo: string }[];
  descuentoPorcentaje: number;
  precioTotal: number;
  precioFinal: number;
}

export default function PaquetesPage() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Paquete[]>('/paquetes')
      .then(setPaquetes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold text-ink">Paquetes de cursos</h1>
      </div>
      <p className="text-ink-muted mb-8">Combos de varios cursos con precio especial.</p>

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : paquetes.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">Todavía no hay paquetes disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paquetes.map((p) => (
            <Link key={p.id} href={`/paquetes/${p.id}`} className="card hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-lg font-bold text-ink">{p.titulo}</h2>
                <span className="text-xs font-bold text-white bg-accent px-2 py-1 rounded flex-shrink-0">
                  -{p.descuentoPorcentaje}%
                </span>
              </div>
              <p className="text-sm text-ink-muted mb-3 line-clamp-2">{p.descripcion}</p>
              <p className="text-xs text-ink-soft mb-3">{p.cursos.length} cursos incluidos</p>
              <div className="flex items-baseline gap-2">
                <span className="text-ink-soft line-through text-sm">${p.precioTotal} USD</span>
                <span className="text-2xl font-bold text-secondary">${p.precioFinal} USD</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
