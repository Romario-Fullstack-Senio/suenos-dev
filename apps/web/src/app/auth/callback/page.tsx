'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { setTokens } from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const sessionToken = searchParams.get('sessionToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Error al autenticar con el proveedor. Por favor, intenta de nuevo.');
      return;
    }

    if (!token || !refreshToken || !sessionToken) {
      setError('No se recibió token de autenticación.');
      return;
    }

    setTokens({ token, refreshToken, sessionToken });

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.sub,
        email: payload.email,
        rol: payload.rol,
        nombre: payload.nombre || payload.email.split('@')[0],
        // Cuentas OAuth siempre arrancan verificadas (ver Usuario.registrarDesdeOAuth).
        emailVerificado: true,
      };
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      if (payload.rol === 'admin') {
        router.push('/admin');
      } else if (payload.rol === 'instructor') {
        router.push('/instructor');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Token inválido.');
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h1>
          <p className="text-ink-muted mb-4">{error}</p>
          <a href="/auth/login" className="text-secondary hover:underline">
            Volver al Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-ink-muted">Autenticando...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
