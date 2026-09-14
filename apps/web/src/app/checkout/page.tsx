'use client';

import { Suspense } from 'react';
import { CheckoutForm } from '@/components/forms/CheckoutForm';

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="h-9 w-48 bg-ink/[0.06] rounded mb-8 animate-pulse" />
          <div className="card h-56 animate-pulse" />
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
