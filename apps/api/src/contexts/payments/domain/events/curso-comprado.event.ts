import { DomainEvent } from '@suenos-dev/shared-kernel';

export class CursoCompradoEvent implements DomainEvent {
  readonly eventName = 'CursoComprado';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly estudianteId: string;
  readonly cursoId: string;

  constructor(aggregateId: string, estudianteId: string, cursoId: string) {
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
    this.estudianteId = estudianteId;
    this.cursoId = cursoId;
  }
}
