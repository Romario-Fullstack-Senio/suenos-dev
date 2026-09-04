import { DomainEvent } from '@suenos-dev/shared-kernel';

/** aggregateId = id de la pregunta. */
export class PreguntaCreada implements DomainEvent {
  readonly eventName = 'PreguntaCreada';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string,
    readonly cursoId: string,
    readonly leccionId: string,
    readonly leccionTitulo: string,
    readonly cursoTitulo: string,
    readonly instructorId: string,
    readonly autorId: string,
    readonly autorNombre: string,
    readonly texto: string,
  ) {
    this.occurredOn = new Date();
  }
}
