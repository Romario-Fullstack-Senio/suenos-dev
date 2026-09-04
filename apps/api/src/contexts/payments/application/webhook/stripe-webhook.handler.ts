import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '../../../../common/event-bus';
import { ORDEN_REPOSITORY, OrdenRepository } from '../../domain/orden.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../../identity/domain/usuario.repository.port';

@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);

  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async handleCheckoutCompleted(sessionId: string): Promise<void> {
    const orden = await this.ordenRepository.findByStripeSessionId(sessionId);

    if (!orden) {
      this.logger.warn(`Orden not found for sessionId: ${sessionId}`);
      return;
    }

    // Look up user data for the email event — el nombre de cada curso ya
    // viene denormalizado en orden.items, no hace falta resolverlo acá.
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

    this.logger.log(`Orden ${orden.id} completada exitosamente`);
  }
}
