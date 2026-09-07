'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const STORAGE_KEY = 'referido_por';

/** Guarda ?ref=<usuarioId> en localStorage la primera vez que aparece en
 * cualquier URL de la app — así, si alguien llega por un link de
 * referido a /cursos/algo, navega un rato, y recién después se registra
 * desde /auth/registro (sin ?ref= en ESA url puntual), RegistroForm
 * igual puede leerlo. No pisa un ?ref= previo con uno nuevo (primer
 * contacto, no "último link que tocó" — mismo criterio que
 * Usuario#referidoPor, que tampoco cambia después del registro). */
export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (!ref) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, ref);
      }
    } catch {
      // localStorage inaccesible — sin persistencia, el registro
      // simplemente no atribuye referido (no bloquea nada).
    }
  }, [searchParams]);

  return null;
}
