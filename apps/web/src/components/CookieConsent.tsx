'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage inaccesible (modo privado estricto, etc.) — no mostramos
      // el banner para no bloquear la UI con algo que no puede persistirse.
    }
  }, []);

  const aceptar = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4">
      <div className="max-w-3xl mx-auto bg-cloud-50 border border-ink/[0.1] rounded-2xl shadow-lg p-5 flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-ink-muted flex-1">
          Usamos cookies técnicas necesarias para mantener tu sesión iniciada. No usamos cookies de
          rastreo publicitario.{' '}
          <Link href="/privacidad" className="text-secondary hover:underline">
            Ver política de privacidad
          </Link>
        </p>
        <button
          type="button"
          onClick={aceptar}
          className="bg-primary text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-600 transition flex-shrink-0"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
