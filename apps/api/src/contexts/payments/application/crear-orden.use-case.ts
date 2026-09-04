import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { randomUUID } from 'crypto';
import { Orden } from '../domain/orden.entity';
import { ORDEN_REPOSITORY, OrdenRepository } from '../domain/orden.repository.port';
import { STRIPE_PAYMENT_INTENT, StripePaymentIntent } from '../domain/stripe-payment-intent.port';
import { CUPON_REPOSITORY, CuponRepository } from '../domain/cupon.repository.port';

export interface CrearOrdenItemInput {
  cursoId: string;
  cursoNombre: string;
  precio: number;
}

export interface CrearOrdenCommand {
  estudianteId: string;
  items: CrearOrdenItemInput[];
  successUrl: string;
  cancelUrl: string;
  // El cupón solo aplica cuando el carrito tiene un único curso — combinar
  // un cupón (casi siempre pensado para un curso puntual, ver
  // Cupon.cursoId) con una compra de varios cursos abre demasiadas
  // preguntas de producto (¿a cuál se le aplica? ¿se reparte?) para
  // resolver de forma genérica acá. El botón "Comprar ahora" de un curso
  // individual sigue soportando cupón exactamente igual que antes.
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
    if (!command.items || command.items.length === 0) {
      throw new DomainError('La orden necesita al menos un curso');
    }
    for (const item of command.items) {
      if (item.precio < 0) {
        throw new DomainError('El precio de un curso no puede ser negativo');
      }
    }

    const items = command.items.map((i) => ({ ...i, id: randomUUID(), precioFinal: i.precio }));
    let descuento = 0;

    if (command.cuponCodigo) {
      if (items.length > 1) {
        throw new DomainError('Los cupones solo se pueden aplicar comprando un curso a la vez');
      }
      const cupon = await this.cuponRepository.findByCodigo(command.cuponCodigo);
      if (!cupon) {
        throw new NotFoundDomainError('Cupón no encontrado');
      }
      const item = items[0];
      const resultado = cupon.esValidoPara(item.cursoId);
      if (!resultado.valido) {
        throw new DomainError(resultado.motivo ?? 'Cupón no válido');
      }
      descuento = cupon.calcularDescuento(item.precio);
      item.precioFinal = Math.max(item.precio - descuento, 0);

      cupon.registrarUso();
      await this.cuponRepository.save(cupon);
    }

    const precioFinal = items.reduce((sum, i) => sum + i.precioFinal, 0);

    const { clientSecret, paymentIntentId } = await this.stripePaymentIntent.createPaymentIntent({
      amount: precioFinal,
      currency: 'usd',
      // Metadata de Stripe: solo texto plano, sirve para identificar el pago
      // en el dashboard de Stripe — el detalle real de ítems vive en la
      // orden, no acá.
      cursoId: items.length === 1 ? items[0].cursoId : `${items.length} cursos`,
      cursoNombre: items.map((i) => i.cursoNombre).join(', '),
    });

    const ordenId = randomUUID();
    const orden = Orden.crear(
      ordenId,
      command.estudianteId,
      items.map((i) => ({ id: i.id, cursoId: i.cursoId, cursoNombre: i.cursoNombre, precio: i.precioFinal })),
      'usd',
      paymentIntentId,
    );
    await this.ordenRepository.save(orden);

    return { ordenId, clientSecret, precioFinal, descuento };
  }
}
