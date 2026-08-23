import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '../../../../common/event-bus';
import { ORDEN_REPOSITORY, OrdenRepository } from '../../domain/orden.repository.port';

@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);

  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    private readonly eventBus: EventBus,
  ) {}

  async handleCheckoutCompleted(sessionId: string): Promise<void> {
    const orden = await this.ordenRepository.findByStripeSessionId(sessionId);

    if (!orden) {
      this.logger.warn(`Orden not found for sessionId: ${sessionId}`);
      return;
    }

    orden.completar();
    await this.ordenRepository.save(orden);

    for (const event of orden.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }

    this.logger.log(`Orden ${orden.id} completada exitosamente`);
  }
}
