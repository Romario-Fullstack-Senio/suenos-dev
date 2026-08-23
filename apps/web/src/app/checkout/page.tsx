'use client';

import { Suspense } from 'react';
import { CheckoutForm } from '@/components/forms/CheckoutForm';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Cargando...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
