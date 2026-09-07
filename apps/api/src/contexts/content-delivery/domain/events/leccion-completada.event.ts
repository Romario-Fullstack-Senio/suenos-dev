import { DomainEvent } from '@suenos-dev/shared-kernel';

/**
 * Antes se emitía como un objeto literal `{ eventName, occurredOn,
 * aggregateId }` sin estudianteId/leccionId/cursoId — inofensivo mientras
 * nadie escuchaba 'LeccionCompletada', pero inutilizable para cualquier
 * handler real (gamificación, analytics...) que necesite saber DE QUIÉN
 * es el progreso. Mismo problema — y misma corrección — que tuvo
 * QuizAprobadoEvent (ver el comentario ahí).
 */
export class LeccionCompletadaEvent implements DomainEvent {
  readonly eventName = 'LeccionCompletada';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string, // id del ProgresoLeccion
    readonly estudianteId: string,
    readonly leccionId: string,
    readonly cursoId: string,
  ) {
    this.occurredOn = new Date();
  }
}
