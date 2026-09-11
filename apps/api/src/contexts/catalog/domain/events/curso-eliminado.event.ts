import { DomainEvent } from '@suenos-dev/shared-kernel';

export class CursoEliminado implements DomainEvent {
  readonly eventName = 'CursoEliminado';
  readonly occurredOn: Date;
  readonly aggregateId: string;

  constructor(params: { cursoId: string }) {
    this.occurredOn = new Date();
    this.aggregateId = params.cursoId;
  }
}
