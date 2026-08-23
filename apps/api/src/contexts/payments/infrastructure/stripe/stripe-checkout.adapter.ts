import { Injectable } from '@nestjs/common';
import {
  StripeCheckout,
  StripeCheckoutSessionParams,
  StripeCheckoutSessionResult,
} from '../../domain/stripe-checkout.port';
import { randomUUID } from 'crypto';

@Injectable()
export class StripeCheckoutAdapter implements StripeCheckout {
  async createSession(params: StripeCheckoutSessionParams): Promise<StripeCheckoutSessionResult> {
    const sessionId = `cs_fake_${randomUUID()}`;
    const url = `https://checkout.stripe.com/pay/${sessionId}`;

    return { sessionId, url };
  }
}
