'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Tag, X } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface Curso {
  id: string;
  titulo: string;
  precio: number;
}

interface CuponAplicado {
  codigo: string;
  descuento: number;
  precioFinal: number;
}

function CheckoutFormInner({ ordenId }: { ordenId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?ordenId=${ordenId}`,
      },
    });

    if (error) {
      setMessage(error.message || 'Error al procesar el pago');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {message && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {message}
        </div>
      )}
      <Button type="submit" isLoading={loading} disabled={!stripe} className="w-full">
        {loading ? 'Procesando...' : 'Pagar ahora'}
      </Button>
    </form>
  );
}

export function CheckoutForm() {
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('cursoId');
  const { user, isAuthenticated } = useAuth();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [ordenId, setOrdenId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creandoOrden, setCreandoOrden] = useState(false);
  const [error, setError] = useState('');

  const [cuponInput, setCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState<CuponAplicado | null>(null);
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [cuponError, setCuponError] = useState('');

  useEffect(() => {
    if (!cursoId) return;
    apiGet<Curso>(`/cursos/${cursoId}`)
      .then(setCurso)
      .catch(() => setError('Error al cargar el curso'))
      .finally(() => setLoading(false));
  }, [cursoId]);

  const aplicarCupon = async () => {
    if (!cursoId || !curso || !cuponInput.trim()) return;
    setValidandoCupon(true);
    setCuponError('');
    try {
      const resultado = await apiPost<CuponAplicado>('/cupones/validar', {
        codigo: cuponInput.trim(),
        cursoId,
        precio: Number(curso.precio),
      });
      setCuponAplicado(resultado);
    } catch (err) {
      setCuponError(err instanceof Error ? err.message : 'Cupón no válido');
      setCuponAplicado(null);
    } finally {
      setValidandoCupon(false);
    }
  };

  const quitarCupon = () => {
    setCuponAplicado(null);
    setCuponInput('');
    setCuponError('');
  };

  const irAPagar = async () => {
    if (!cursoId || !curso || !user) return;
    setCreandoOrden(true);
    setError('');
    try {
      const result = await apiPost<{ clientSecret: string; ordenId: string }>('/ordenes', {
        estudianteId: user.id,
        cursoId: cursoId,
        precio: Number(curso.precio),
        cursoNombre: curso.titulo,
        successUrl: `${window.location.origin}/dashboard`,
        cancelUrl: `${window.location.origin}/checkout?cursoId=${cursoId}`,
        cuponCodigo: cuponAplicado?.codigo,
      });
      setClientSecret(result.clientSecret);
      setOrdenId(result.ordenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al inicializar el pago');
    } finally {
      setCreandoOrden(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-ink-muted mb-4">Debes iniciar sesión para comprar</p>
        <Button onClick={() => window.location.href = '/auth/login'}>
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-ink-muted">Cargando checkout...</p>
      </div>
    );
  }

  const precioMostrado = cuponAplicado ? cuponAplicado.precioFinal : curso?.precio ?? 49.99;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="bg-cloud-100 rounded-xl p-8 shadow-sm border border-ink/[0.07]">
        <p className="text-ink-muted mb-4">Resumen de tu compra:</p>
        <div className="border-b pb-4 mb-6">
          <p className="font-medium">{curso?.titulo || 'Curso'}</p>
          {cuponAplicado ? (
            <div className="flex items-baseline gap-2">
              <p className="text-lg text-ink-soft line-through">${curso?.precio} USD</p>
              <p className="text-2xl font-bold text-secondary">${precioMostrado.toFixed(2)} USD</p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-secondary">${precioMostrado} USD</p>
          )}
        </div>

        {!clientSecret && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink-muted mb-1">Código de cupón</label>
            {cuponAplicado ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-primary/30 rounded-xl bg-primary/5">
                <Tag className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="flex-1 text-sm text-ink font-medium">
                  {cuponAplicado.codigo} aplicado — ahorras ${cuponAplicado.descuento.toFixed(2)} USD
                </span>
                <button type="button" onClick={quitarCupon} className="text-ink-soft hover:text-red-500" aria-label="Quitar cupón">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cuponInput}
                  onChange={e => setCuponInput(e.target.value.toUpperCase())}
                  placeholder="Ej: BIENVENIDA10"
                  className="flex-1 px-3 py-2 bg-white text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button type="button" variant="secondary" onClick={aplicarCupon} isLoading={validandoCupon} disabled={!cuponInput.trim() || validandoCupon}>
                  Aplicar
                </Button>
              </div>
            )}
            {cuponError && <p className="mt-1 text-sm text-red-500">{cuponError}</p>}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutFormInner ordenId={ordenId} />
          </Elements>
        ) : (
          <Button className="w-full" onClick={irAPagar} isLoading={creandoOrden} disabled={creandoOrden || !curso}>
            Continuar al pago
          </Button>
        )}

        <div className="mt-4 p-3 bg-white rounded-lg text-xs text-ink-muted">
          <p className="font-medium mb-1">Tarjetas de prueba:</p>
          <p>4242 4242 4242 4242 — Pago exitoso</p>
          <p>4000 0025 0000 3155 — Requiere autenticación</p>
          <p>4000 0000 0000 9995 — Fondos insuficientes</p>
        </div>
      </div>
    </div>
  );
}
