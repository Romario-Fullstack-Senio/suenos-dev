export const STRIPE_PAYMENT_INTENT = 'STRIPE_PAYMENT_INTENT';

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  cursoId: string;
  cursoNombre: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface StripePaymentIntent {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
}
