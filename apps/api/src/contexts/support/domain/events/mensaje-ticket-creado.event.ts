import { DomainEvent } from '@suenos-dev/shared-kernel';

/** aggregateId = id del ticket. Avisa a "la otra parte" de la conversación
 * (al usuario si respondió un admin, a los admins si respondió el usuario). */
export class MensajeTicketCreado implements DomainEvent {
  readonly eventName = 'MensajeTicketCreado';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string,
    readonly asunto: string,
    readonly ticketUsuarioId: string,
    readonly autorId: string,
    readonly autorNombre: string,
    readonly autorEsAdmin: boolean,
    readonly texto: string,
  ) {
    this.occurredOn = new Date();
  }
}
