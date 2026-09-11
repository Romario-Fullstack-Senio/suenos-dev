import { ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';

export const STRIPE_API_VERSION = '2026-07-29.dahlia';

let cliente: Stripe | null = null;

/**
 * Cliente de Stripe creado RECIÉN cuando se lo usa, no en el constructor.
 *
 * `new Stripe(undefined)` lanza "Neither apiKey nor config.authenticator
 * provided". Al construirlo en el constructor de los adapters, Nest no podía
 * instanciar PaymentsModule y la API ENTERA no arrancaba si faltaba
 * STRIPE_SECRET_KEY: se caían login, catálogo y aprendizaje por una clave de
 * pagos mal cargada. Es además lo que rompía el job de E2E en CI, donde ese
 * secret no está configurado.
 *
 * Con esto la app levanta igual y solo fallan —con un error claro— las
 * operaciones que de verdad necesitan Stripe. Es el mismo criterio que ya
 * usaban las estrategias de OAuth (devuelven null si faltan las env vars) y
 * la cadena de adapters de email.
 */
export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new ServiceUnavailableException(
      'Los pagos no están disponibles: falta configurar STRIPE_SECRET_KEY en este entorno.',
    );
  }
  if (!cliente) {
    cliente = new Stripe(apiKey, { apiVersion: STRIPE_API_VERSION });
  }
  return cliente;
}

/** Para ramas que quieran degradar en vez de fallar (ver el webhook). */
export function stripeConfigurado(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Solo para tests: olvida el cliente memoizado. */
export function resetStripeClient(): void {
  cliente = null;
}
