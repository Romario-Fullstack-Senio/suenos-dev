import { Injectable } from '@nestjs/common';
import {
  StripePaymentIntent,
  CreatePaymentIntentParams,
  PaymentIntentResult,
} from '../../domain/stripe-payment-intent.port';
import { getStripe } from './stripe-client';

@Injectable()
export class StripePaymentIntentAdapter implements StripePaymentIntent {
  // Sin cliente en el constructor: getStripe() lo crea en el primer uso real,
  // así una STRIPE_SECRET_KEY ausente no impide que arranque la API entera.
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        cursoId: params.cursoId,
        cursoNombre: params.cursoNombre,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  async refund(paymentIntentId: string): Promise<{ refundId: string }> {
    const refund = await getStripe().refunds.create({ payment_intent: paymentIntentId });
    return { refundId: refund.id };
  }
}
