'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { Button } from '@/components/ui/Button';
import { Package, Check } from 'lucide-react';

interface CursoIncluido {
  id: string;
  titulo: string;
  precio: number;
  imagenUrl?: string;
  slug: string;
}

interface Paquete {
  id: string;
  titulo: string;
  descripcion: string;
  cursos: CursoIncluido[];
  descuentoPorcentaje: number;
  precioTotal: number;
  precioFinal: number;
}

export default function PaqueteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const paqueteId = params.id as string;
  const { isAuthenticated } = useAuth();
  const [paquete, setPaquete] = useState<Paquete | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Paquete>(`/paquetes/${paqueteId}`)
      .then(setPaquete)
      .finally(() => setLoading(false));
  }, [paqueteId]);

  if (loading) return <p className="text-center py-16">Cargando...</p>;
  if (!paquete) return <p className="text-center py-16">Paquete no encontrado</p>;

  const comprar = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    router.push(`/checkout?paqueteId=${paquete.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold text-ink">{paquete.titulo}</h1>
      </div>
      <p className="text-ink-muted mb-8">{paquete.descripcion}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-ink mb-2">Cursos incluidos</h2>
          {paquete.cursos.map((c) => (
            <Link key={c.id} href={`/cursos/${c.slug}`} className="card flex items-center gap-4 hover:shadow-md transition">
              <CourseCoverImage imagenUrl={c.imagenUrl} titulo={c.titulo} className="w-24 h-16 flex-shrink-0 rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink truncate">{c.titulo}</p>
                <p className="text-sm text-ink-soft">${c.precio} USD por separado</p>
              </div>
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            </Link>
          ))}
        </div>

        <div className="card h-fit sticky top-24">
          <p className="text-sm text-ink-muted mb-1">Precio de lista</p>
          <p className="text-lg text-ink-soft line-through mb-2">${paquete.precioTotal} USD</p>
          <p className="text-sm text-ink-muted mb-1">Precio del paquete (-{paquete.descuentoPorcentaje}%)</p>
          <p className="text-3xl font-bold text-secondary mb-6">${paquete.precioFinal} USD</p>
          <Button onClick={comprar} className="w-full">
            Comprar paquete
          </Button>
        </div>
      </div>
    </div>
  );
}
