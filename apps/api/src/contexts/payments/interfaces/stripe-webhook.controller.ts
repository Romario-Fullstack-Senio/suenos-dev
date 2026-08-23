import { Controller, Post, Req, Res, RawBodyRequest, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Inject } from '@nestjs/common';
import { ORDEN_REPOSITORY, OrdenRepository } from '../domain/orden.repository.port';
import { EventBus } from '../../../common/event-bus';

@Controller()
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private stripe: Stripe;

  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    private readonly eventBus: EventBus,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      this.logger.warn('Missing stripe-signature or STRIPE_WEBHOOK_SECRET');
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        sig,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.handlePaymentSucceeded(paymentIntent);
    }

    res.status(200).json({ received: true });
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const orden = await this.ordenRepository.findByStripeSessionId(paymentIntent.id);

    if (!orden) {
      this.logger.warn(`Orden not found for payment_intent: ${paymentIntent.id}`);
      return;
    }

    if (orden.estado === 'completada') {
      this.logger.log(`Orden ${orden.id} already completed`);
      return;
    }

    orden.completar();
    await this.ordenRepository.save(orden);

    for (const event of orden.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }

    this.logger.log(`Orden ${orden.id} completed via webhook`);
  }
}
