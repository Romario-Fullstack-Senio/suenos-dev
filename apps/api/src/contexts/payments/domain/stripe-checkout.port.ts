export const STRIPE_CHECKOUT = 'STRIPE_CHECKOUT';

export interface StripeCheckoutSessionParams {
  cursoId: string;
  precio: number;
  cursoNombre: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeCheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface StripeCheckout {
  createSession(params: StripeCheckoutSessionParams): Promise<StripeCheckoutSessionResult>;
}
