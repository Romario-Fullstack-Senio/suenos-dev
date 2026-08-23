'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface Curso {
  id: string;
  titulo: string;
  precio: number;
}

function CheckoutFormInner({ cursoId, clientSecret, ordenId }: { cursoId: string; clientSecret: string; ordenId: string }) {
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cursoId || !user) return;

    const initPayment = async () => {
      try {
        const cursoData = await apiGet<Curso>(`/cursos/${cursoId}`);
        setCurso(cursoData);

        const result = await apiPost<{ clientSecret: string; ordenId: string }>('/ordenes', {
          estudianteId: user.id,
          cursoId: cursoId,
          precio: Number(cursoData.precio),
          cursoNombre: cursoData.titulo,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/checkout?cursoId=${cursoId}`,
        });

        setClientSecret(result.clientSecret);
        setOrdenId(result.ordenId);
      } catch (err) {
        setError('Error al inicializar el pago');
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [cursoId, user]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">Debes iniciar sesión para comprar</p>
        <Button onClick={() => window.location.href = '/auth/login'}>
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Cargando checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border">
        <p className="text-gray-600 mb-4">Resumen de tu compra:</p>
        <div className="border-b pb-4 mb-6">
          <p className="font-medium">{curso?.titulo || 'Curso'}</p>
          <p className="text-2xl font-bold text-primary">${curso?.precio || 49.99} USD</p>
        </div>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutFormInner cursoId={cursoId!} clientSecret={clientSecret} ordenId={ordenId} />
          </Elements>
        ) : (
          <Button className="w-full" disabled>
            No se pudo inicializar el pago
          </Button>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-medium mb-1">Tarjetas de prueba:</p>
          <p>4242 4242 4242 4242 — Pago exitoso</p>
          <p>4000 0025 0000 3155 — Requiere autenticación</p>
          <p>4000 0000 0000 9995 — Fondos insuficientes</p>
        </div>
      </div>
    </div>
  );
}
