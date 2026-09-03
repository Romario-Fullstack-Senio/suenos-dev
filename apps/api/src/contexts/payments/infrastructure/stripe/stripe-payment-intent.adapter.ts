import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import {
  StripePaymentIntent,
  CreatePaymentIntentParams,
  PaymentIntentResult,
} from '../../domain/stripe-payment-intent.port';

@Injectable()
export class StripePaymentIntentAdapter implements StripePaymentIntent {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
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
    const refund = await this.stripe.refunds.create({ payment_intent: paymentIntentId });
    return { refundId: refund.id };
  }
}
