import { DomainEvent } from '@suenos-dev/shared-kernel';

/**
 * Antes este evento se emitía como un objeto literal `{ eventName, occurredOn,
 * aggregateId }` desde Quiz.resolver() — sin estudianteId/cursoId/nombres, los
 * campos que GenerarCertificadoHandler (certification context) necesita para
 * emitir el certificado. El handler los recibía siempre `undefined`, así que
 * cualquier certificado "automático" nacía con datos vacíos.
 */
export class QuizAprobadoEvent implements DomainEvent {
  readonly eventName = 'QuizAprobado';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string, // quizId
    readonly estudianteId: string,
    readonly cursoId: string,
    readonly estudianteNombre: string,
    readonly cursoNombre: string,
  ) {
    this.occurredOn = new Date();
  }
}
