import { DomainEvent } from '@suenos-dev/shared-kernel';

export class CursoCompradoEvent implements DomainEvent {
  readonly eventName = 'CursoComprado';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly estudianteId: string;
  readonly cursoId: string;
  readonly alumnoEmail: string;
  readonly alumnoNombre: string;
  readonly cursoNombre: string;
  readonly precio: number;

  constructor(
    aggregateId: string,
    estudianteId: string,
    cursoId: string,
    alumnoEmail: string,
    alumnoNombre: string,
    cursoNombre: string,
    precio: number,
  ) {
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
    this.estudianteId = estudianteId;
    this.cursoId = cursoId;
    this.alumnoEmail = alumnoEmail;
    this.alumnoNombre = alumnoNombre;
    this.cursoNombre = cursoNombre;
    this.precio = precio;
  }
}
