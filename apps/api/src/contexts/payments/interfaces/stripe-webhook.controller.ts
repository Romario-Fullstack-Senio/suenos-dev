import { Controller, Post, Req, Res, RawBodyRequest, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Inject } from '@nestjs/common';
import { ORDEN_REPOSITORY, OrdenRepository } from '../domain/orden.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { EventBus } from '../../../common/event-bus';
import { getStripe } from '../infrastructure/stripe/stripe-client';

@Controller()
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  // El cliente de Stripe se pide con getStripe() en el momento de verificar
  // la firma, no en el constructor: construirlo acá tumbaba el arranque de
  // toda la API cuando faltaba STRIPE_SECRET_KEY (ver stripe-client.ts).
  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      this.logger.warn('Missing stripe-signature header');
      res.status(400).json({ error: 'Missing signature header' });
      return;
    }

    const sinSecretoReal = !webhookSecret || webhookSecret === 'whsec_test_secret';

    // En producción (prod y preprod corren con NODE_ENV=production) NUNCA se
    // procesa un evento sin verificar la firma. Antes, si faltaba el secreto,
    // cualquiera podía mandar un payment_intent.succeeded falso con el id de
    // su propio PaymentIntent (sale del clientSecret que recibe al pagar) y
    // quedarse con el curso sin pagar.
    if (sinSecretoReal && process.env.NODE_ENV === 'production') {
      this.logger.error('STRIPE_WEBHOOK_SECRET no configurado — webhook rechazado');
      res.status(500).json({ error: 'Webhook not configured' });
      return;
    }

    // Solo dev/E2E: el placeholder whsec_test_secret (ver e2e.yml) procesa el
    // evento simulado sin verificar firma.
    if (sinSecretoReal) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured - processing without verification');
      const event = JSON.parse(req.rawBody!.toString());
      await this.processEvent(event);
      res.status(200).json({ received: true });
      return;
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(
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
    await this.processEvent(event);
    res.status(200).json({ received: true });
  }

  private async processEvent(event: Stripe.Event) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.handlePaymentSucceeded(paymentIntent);
    }
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

    // Look up user data for the email event — el nombre de cada curso ya
    // viene denormalizado en orden.items.
    let alumnoEmail = '';
    let alumnoNombre = '';

    try {
      const usuario = await this.usuarioRepository.findById(orden.estudianteId);
      if (usuario) {
        alumnoEmail = usuario.email.value || String(usuario.email);
        alumnoNombre = usuario.nombre;
      }
    } catch {
      // Best-effort: si falla la lectura, el email sale con campos vacíos
      // en vez de tumbar la confirmación del webhook de Stripe.
    }

    orden.completar({ email: alumnoEmail, nombre: alumnoNombre });
    await this.ordenRepository.save(orden);

    for (const event of orden.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }

    this.logger.log(`Orden ${orden.id} completed via webhook`);
  }
}
