import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { Orden } from '../domain/orden.entity';
import { ORDEN_REPOSITORY, OrdenRepository } from '../domain/orden.repository.port';
import { STRIPE_PAYMENT_INTENT, StripePaymentIntent } from '../domain/stripe-payment-intent.port';
import { CUPON_REPOSITORY, CuponRepository } from '../domain/cupon.repository.port';
import { randomUUID } from 'crypto';

export interface CrearOrdenCommand {
  estudianteId: string;
  cursoId: string;
  precio: number;
  cursoNombre: string;
  successUrl: string;
  cancelUrl: string;
  cuponCodigo?: string;
}

@Injectable()
export class CrearOrdenUseCase {
  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    @Inject(STRIPE_PAYMENT_INTENT)
    private readonly stripePaymentIntent: StripePaymentIntent,
    @Inject(CUPON_REPOSITORY)
    private readonly cuponRepository: CuponRepository,
  ) {}

  async execute(
    command: CrearOrdenCommand,
  ): Promise<{ ordenId: string; clientSecret: string; precioFinal: number; descuento: number }> {
    let precioFinal = command.precio;
    let descuento = 0;
    const cupon = command.cuponCodigo
      ? await this.cuponRepository.findByCodigo(command.cuponCodigo)
      : null;

    if (command.cuponCodigo) {
      if (!cupon) {
        throw new NotFoundDomainError('Cupón no encontrado');
      }
      const resultado = cupon.esValidoPara(command.cursoId);
      if (!resultado.valido) {
        throw new DomainError(resultado.motivo ?? 'Cupón no válido');
      }
      descuento = cupon.calcularDescuento(command.precio);
      precioFinal = Math.max(command.precio - descuento, 0);
    }

    const { clientSecret, paymentIntentId } = await this.stripePaymentIntent.createPaymentIntent({
      amount: precioFinal,
      currency: 'usd',
      cursoId: command.cursoId,
      cursoNombre: command.cursoNombre,
    });

    const ordenId = randomUUID();
    const orden = Orden.crear(ordenId, command.estudianteId, command.cursoId, precioFinal, 'usd', paymentIntentId);
    await this.ordenRepository.save(orden);

    if (cupon) {
      cupon.registrarUso();
      await this.cuponRepository.save(cupon);
    }

    return { ordenId, clientSecret, precioFinal, descuento };
  }
}
