import { DomainEvent } from '@suenos-dev/shared-kernel';

export class CursoPublicado implements DomainEvent {
  readonly eventName = 'CursoPublicado';
  readonly occurredOn: Date;
  readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
  }
}
