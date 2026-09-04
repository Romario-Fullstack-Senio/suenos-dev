import { DomainEvent } from '@suenos-dev/shared-kernel';

/** aggregateId = id de la respuesta. Se notifica al autor de la pregunta
 * original (si no es quien acaba de responderse a sí mismo). */
export class RespuestaCreada implements DomainEvent {
  readonly eventName = 'RespuestaCreada';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string,
    readonly preguntaId: string,
    readonly cursoId: string,
    readonly leccionId: string,
    readonly leccionTitulo: string,
    readonly cursoTitulo: string,
    readonly preguntaAutorId: string,
    readonly respuestaAutorId: string,
    readonly respuestaAutorNombre: string,
    readonly respuestaAutorEsInstructor: boolean,
    readonly texto: string,
  ) {
    this.occurredOn = new Date();
  }
}
