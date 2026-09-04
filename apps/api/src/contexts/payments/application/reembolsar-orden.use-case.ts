import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { ORDEN_REPOSITORY, OrdenRepository } from '../domain/orden.repository.port';
import { STRIPE_PAYMENT_INTENT, StripePaymentIntent } from '../domain/stripe-payment-intent.port';
import { INSCRIPCION_REPOSITORY, InscripcionRepository } from '../../enrollment/domain/inscripcion.repository.port';
import { EventBus } from '../../../common/event-bus';

const VENTANA_AUTOSERVICIO_DIAS = 7;

export interface ReembolsarOrdenCommand {
  ordenId: string;
  callerId: string;
  callerRol: string;
}

@Injectable()
export class ReembolsarOrdenUseCase {
  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepo: OrdenRepository,
    @Inject(STRIPE_PAYMENT_INTENT)
    private readonly stripePaymentIntent: StripePaymentIntent,
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepo: InscripcionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReembolsarOrdenCommand): Promise<void> {
    const orden = await this.ordenRepo.findById(command.ordenId);
    if (!orden) {
      throw new NotFoundDomainError('Orden no encontrada');
    }

    const esAdmin = command.callerRol === 'admin';
    if (!esAdmin) {
      if (orden.estudianteId !== command.callerId) {
        throw new UnauthorizedDomainError('No tenés permiso para reembolsar esta orden');
      }
      const diasDesdeCompra = (Date.now() - orden.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diasDesdeCompra > VENTANA_AUTOSERVICIO_DIAS) {
        throw new DomainError(
          `Ya pasaron más de ${VENTANA_AUTOSERVICIO_DIAS} días desde la compra — contactá a soporte para pedir un reembolso`,
        );
      }
    }

    // orden.stripeSessionId guarda en realidad el paymentIntentId (ver
    // CrearOrdenUseCase) — el nombre del campo es historia previa a esta
    // sesión, no lo renombro acá para no tocar de más.
    await this.stripePaymentIntent.refund(orden.stripeSessionId);

    orden.reembolsar();
    await this.ordenRepo.save(orden);

    // Revoca el acceso a TODOS los cursos de la orden — un reembolso es
    // siempre de la orden completa, no de un curso puntual dentro del
    // carrito (ver la nota en CrearOrdenCommand sobre por qué el carrito no
    // desglosa reembolsos parciales por ítem en esta primera versión).
    for (const item of orden.items) {
      const inscripcion = await this.inscripcionRepo.findByCursoYEstudiante(item.cursoId, orden.estudianteId);
      if (inscripcion?.activa) {
        inscripcion.desactivar();
        await this.inscripcionRepo.save(inscripcion);
      }
    }

    for (const event of orden.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
