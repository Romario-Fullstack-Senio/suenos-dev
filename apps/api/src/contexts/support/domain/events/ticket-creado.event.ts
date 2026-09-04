import { DomainEvent } from '@suenos-dev/shared-kernel';

/** aggregateId = id del ticket. Notifica a los admins que hay un ticket nuevo. */
export class TicketCreado implements DomainEvent {
  readonly eventName = 'TicketCreado';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string,
    readonly usuarioId: string,
    readonly usuarioNombre: string,
    readonly asunto: string,
  ) {
    this.occurredOn = new Date();
  }
}
