'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { Button } from '@/components/ui/Button';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { formatearPrecio } from '@/lib/format';

export default function CarritoPage() {
  const { items, removeItem, total } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const irAPagar = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/carrito');
      return;
    }
    router.push('/checkout?carrito=1');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EstadoVacio
          icono={ShoppingCart}
          titulo="Tu carrito está vacío"
          texto="Explorá el catálogo y agregá los cursos que te interesen."
          cta={{ href: '/cursos', label: 'Ver cursos' }}
          variante="plano"
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Tu carrito</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.cursoId} className="card p-4 flex items-center gap-4">
            <CourseCoverImage imagenUrl={item.imagenUrl} titulo={item.titulo} className="w-24 h-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Link href={`/cursos/${item.slug}`} className="font-semibold text-ink hover:text-primary transition truncate block">
                {item.titulo}
              </Link>
              <p className="font-extrabold text-ink mt-1">{formatearPrecio(item.precio)}</p>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.cursoId)}
              className="text-ink-soft hover:text-red-500 transition p-2 flex-shrink-0"
              aria-label={`Quitar ${item.titulo} del carrito`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-ink-muted">
            {items.length} {items.length === 1 ? 'curso' : 'cursos'}
          </span>
          <span className="text-2xl font-extrabold text-ink">{formatearPrecio(total)}</span>
        </div>
        <Button className="w-full" onClick={irAPagar}>
          Proceder al pago
        </Button>
        {items.length > 1 && (
          <p className="text-xs text-ink-soft text-center mt-3">
            Los cupones de descuento solo se pueden aplicar comprando un curso a la vez.
          </p>
        )}
      </div>
    </div>
  );
}
