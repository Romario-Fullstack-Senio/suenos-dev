'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function CallbackContent() {
  const searchParams = useSearchParams();
  const { loginConTokens } = useAuth();
  const [error, setError] = useState<string | null>(null);
  // El efecto puede re-ejecutarse (StrictMode, o searchParams/loginConTokens
  // cambiando de referencia) — sin este guard, loginConTokens() se llamaría
  // dos veces y el segundo router.push pisaría al primero a mitad de camino.
  const yaProcesado = useRef(false);

  useEffect(() => {
    if (yaProcesado.current) return;

    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const sessionToken = searchParams.get('sessionToken');
    const avatarUrl = searchParams.get('avatarUrl');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Error al autenticar con el proveedor. Por favor, intenta de nuevo.');
      return;
    }

    if (!token || !refreshToken || !sessionToken) {
      setError('No se recibió token de autenticación.');
      return;
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const usuario = {
        id: payload.sub,
        email: payload.email,
        rol: payload.rol,
        nombre: payload.nombre || payload.email.split('@')[0],
        // Cuentas OAuth siempre arrancan verificadas (ver Usuario.registrarDesdeOAuth).
        emailVerificado: true,
        // No viaja en el JWT (se mantiene liviano) — el backend lo manda
        // aparte en el redirect, ver OAuthController.
        avatarUrl: avatarUrl || null,
      };
      yaProcesado.current = true;
      // Actualiza el estado de React (no solo localStorage) y redirige
      // según el rol — mismo camino que un login por email/password, ver
      // AuthContext.finalizarLogin.
      loginConTokens({ token, refreshToken, sessionToken, usuario });
    } catch {
      setError('Token inválido.');
    }
  }, [searchParams, loginConTokens]);

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
