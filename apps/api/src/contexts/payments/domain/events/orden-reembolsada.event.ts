import { DomainEvent } from '@suenos-dev/shared-kernel';

export class OrdenReembolsadaEvent implements DomainEvent {
  readonly eventName = 'OrdenReembolsada';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly estudianteId: string;
  readonly cursoId: string;
  readonly monto: number;

  constructor(aggregateId: string, estudianteId: string, cursoId: string, monto: number) {
    this.aggregateId = aggregateId;
    this.estudianteId = estudianteId;
    this.cursoId = cursoId;
    this.monto = monto;
    this.occurredOn = new Date();
  }
}
