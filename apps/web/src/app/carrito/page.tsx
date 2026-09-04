'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { CourseCoverImage } from '@/components/CourseCoverImage';
import { Button } from '@/components/ui/Button';

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
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-12 h-12 text-ink-soft mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Tu carrito está vacío</h1>
        <p className="text-ink-muted mb-6">Explorá el catálogo y agregá los cursos que te interesen.</p>
        <Link href="/cursos" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-600 transition">
          Ver cursos
        </Link>
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
              <p className="text-accent font-bold mt-1">${item.precio} USD</p>
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
          <span className="text-2xl font-bold text-secondary">${total.toFixed(2)} USD</span>
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
