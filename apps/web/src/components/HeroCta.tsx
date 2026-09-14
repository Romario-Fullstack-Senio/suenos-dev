'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

/**
 * El CTA del hero depende de la sesión, y la landing es un Server Component
 * (no puede leer localStorage). Antes el botón primario decía siempre "Ir a
 * mi panel": un visitante sin cuenta hacía click y caía en /dashboard, que
 * le responde "Debes iniciar sesión" — el 100% del tráfico frío contra un
 * muro. Mientras AuthContext hidrata mostramos el par para anónimos, que es
 * el caso mayoritario del tráfico de la home.
 */
export function HeroCta() {
  const { isAuthenticated, isLoading } = useAuth();
  const autenticado = !isLoading && isAuthenticated;

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-3.5">
      {autenticado ? (
        <>
          <Link href="/dashboard" className="btn-primary text-[17px]">
            Continuar aprendiendo <span aria-hidden>→</span>
          </Link>
          <Link href="/cursos" className="btn-ghost text-[17px]">
            Explorar cursos
          </Link>
        </>
      ) : (
        <>
          <Link href="/auth/registro" className="btn-primary text-[17px]">
            Crear cuenta gratis <span aria-hidden>→</span>
          </Link>
          <Link href="/cursos" className="btn-ghost text-[17px]">
            Explorar cursos
          </Link>
        </>
      )}
    </div>
  );
}
