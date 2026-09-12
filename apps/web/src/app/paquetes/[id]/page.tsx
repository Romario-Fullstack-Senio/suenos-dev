'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { Button } from '@/components/ui/Button';
import { Package, Check } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { SkeletonList } from '@/components/ui/SkeletonGrid';
import { formatearPrecio } from '@/lib/format';

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-9 w-72 bg-ink/[0.06] rounded mb-8 animate-pulse" />
        <SkeletonList cantidad={3} />
      </div>
    );
  }
  if (!paquete) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <EstadoVacio
          icono={Package}
          titulo="Paquete no encontrado"
          texto="El enlace puede estar roto o el paquete ya no está disponible."
          cta={{ href: '/paquetes', label: 'Ver paquetes' }}
          variante="plano"
        />
      </div>
    );
  }

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
                <p className="text-sm text-ink-soft">{formatearPrecio(c.precio)} por separado</p>
              </div>
              <Check className="w-5 h-5 text-success flex-shrink-0" />
            </Link>
          ))}
        </div>

        <div className="card h-fit sticky top-24">
          <p className="text-sm text-ink-muted mb-1">Precio de lista</p>
          <p className="text-lg text-ink-soft line-through mb-2">{formatearPrecio(paquete.precioTotal)}</p>
          <p className="text-sm text-ink-muted mb-1">Precio del paquete (-{paquete.descuentoPorcentaje}%)</p>
          <p className="text-3xl font-extrabold text-ink mb-6">{formatearPrecio(paquete.precioFinal)}</p>
          <Button onClick={comprar} className="w-full">
            Comprar paquete
          </Button>
        </div>
      </div>
    </div>
  );
}
