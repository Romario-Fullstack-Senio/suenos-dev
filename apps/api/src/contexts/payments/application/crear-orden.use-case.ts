import { Inject, Injectable } from '@nestjs/common';
import { Orden } from '../domain/orden.entity';
import { ORDEN_REPOSITORY, OrdenRepository } from '../domain/orden.repository.port';
import { STRIPE_CHECKOUT, StripeCheckout } from '../domain/stripe-checkout.port';
import { STRIPE_PAYMENT_INTENT, StripePaymentIntent } from '../domain/stripe-payment-intent.port';
import { randomUUID } from 'crypto';

export interface CrearOrdenCommand {
  estudianteId: string;
  cursoId: string;
  precio: number;
  cursoNombre: string;
  successUrl: string;
  cancelUrl: string;
}

@Injectable()
export class CrearOrdenUseCase {
  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    @Inject(STRIPE_CHECKOUT)
    private readonly stripeCheckout: StripeCheckout,
    @Inject(STRIPE_PAYMENT_INTENT)
    private readonly stripePaymentIntent: StripePaymentIntent,
  ) {}

  async execute(command: CrearOrdenCommand): Promise<{ ordenId: string; clientSecret: string }> {
    const { clientSecret, paymentIntentId } = await this.stripePaymentIntent.createPaymentIntent({
      amount: command.precio,
      currency: 'usd',
      cursoId: command.cursoId,
      cursoNombre: command.cursoNombre,
    });

    const orden = Orden.crear(
      paymentIntentId,
      command.estudianteId,
      command.cursoId,
      command.precio,
      'usd',
      paymentIntentId,
    );

    await this.ordenRepository.save(orden);

    return { ordenId: paymentIntentId, clientSecret };
  }
}
