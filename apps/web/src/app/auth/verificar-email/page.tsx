'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';
import Link from 'next/link';

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('error');
      setMensaje('Falta el token de verificación en el enlace.');
      return;
    }
    apiPost('/auth/verify-email', { token })
      .then(() => setEstado('ok'))
      .catch((error) => {
        setEstado('error');
        setMensaje(error instanceof Error ? error.message : 'El enlace no es válido o ya expiró');
      });
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-16 p-8 card text-center">
      {estado === 'cargando' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-ink-muted">Verificando tu email…</p>
        </>
      )}
      {estado === 'ok' && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-ink">¡Email confirmado! ✅</h1>
          <p className="text-ink-muted mb-6">Tu cuenta ya está completamente activada.</p>
          <Link href="/dashboard" className="text-secondary hover:underline">
            Ir a mi panel
          </Link>
        </>
      )}
      {estado === 'error' && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-ink">No pudimos verificar tu email</h1>
          <p className="text-ink-muted mb-6">{mensaje}</p>
          <Link href="/perfil" className="text-secondary hover:underline">
            Reenviar verificación desde tu perfil
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    }>
      <VerificarEmailContent />
    </Suspense>
  );
}
