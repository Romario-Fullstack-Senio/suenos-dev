import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '../../../../common/event-bus';
import { ORDEN_REPOSITORY, OrdenRepository } from '../../domain/orden.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../../identity/domain/usuario.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../../catalog/domain/curso.repository.port';

@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);

  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async handleCheckoutCompleted(sessionId: string): Promise<void> {
    const orden = await this.ordenRepository.findByStripeSessionId(sessionId);

    if (!orden) {
      this.logger.warn(`Orden not found for sessionId: ${sessionId}`);
      return;
    }

    // Look up user and course data for the email event
    let alumnoEmail = '';
    let alumnoNombre = '';
    let cursoNombre = '';

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

    try {
      const curso = await this.cursoRepository.findById(orden.cursoId);
      if (curso) {
        cursoNombre = curso.titulo;
      }
    } catch {
      // Idem — no bloquear la confirmación del pago por esto.
    }

    orden.completar({
      alumnoEmail,
      alumnoNombre,
      cursoNombre,
      precio: orden.monto,
    });
    await this.ordenRepository.save(orden);

    for (const event of orden.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }

    this.logger.log(`Orden ${orden.id} completada exitosamente`);
  }
}
