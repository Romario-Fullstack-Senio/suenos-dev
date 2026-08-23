import { Body, Controller, Post, Param, UseGuards, Inject } from '@nestjs/common';
import { CrearOrdenUseCase, CrearOrdenCommand } from '../application/crear-orden.use-case';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  STRIPE_PAYMENT_INTENT,
  StripePaymentIntent,
} from '../domain/stripe-payment-intent.port';
import {
  ORDEN_REPOSITORY,
  OrdenRepository,
} from '../domain/orden.repository.port';
import { EventBus } from '../../../common/event-bus';
import { Orden } from '../domain/orden.entity';
import { randomUUID } from 'crypto';

@Controller('ordenes')
export class OrdenController {
  constructor(
    private readonly crearOrden: CrearOrdenUseCase,
    @Inject(STRIPE_PAYMENT_INTENT) private readonly paymentIntent: StripePaymentIntent,
    @Inject(ORDEN_REPOSITORY) private readonly ordenRepository: OrdenRepository,
    private readonly eventBus: EventBus,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crear(@Body() command: CrearOrdenCommand) {
    const result = await this.paymentIntent.createPaymentIntent({
      amount: command.precio,
      currency: 'usd',
      cursoId: command.cursoId,
      cursoNombre: command.cursoNombre,
    });

    const ordenId = randomUUID();
    const orden = Orden.crear(
      ordenId,
      command.estudianteId,
      command.cursoId,
      command.precio,
      'usd',
      result.paymentIntentId,
    );
    await this.ordenRepository.save(orden);

    return {
      ordenId,
      clientSecret: result.clientSecret,
    };
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmar(@Param('id') id: string) {
    const orden = await this.ordenRepository.findById(id);

    if (!orden) {
      return { error: 'Orden no encontrada' };
    }

    if (orden.estado === 'completada') {
      return { message: 'Orden ya completada', ordenId: orden.id };
    }

    orden.completar();
    await this.ordenRepository.save(orden);

    for (const event of orden.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }

    return { message: 'Pago confirmado', ordenId: orden.id };
  }
}
