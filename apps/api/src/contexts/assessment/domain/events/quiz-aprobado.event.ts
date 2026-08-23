export class QuizAprobadoEvent {
  readonly eventName = 'QuizAprobado';
  readonly timestamp: Date;

  constructor(
    readonly aggregateId: string,
    readonly estudianteId: string,
    readonly cursoId: string,
  ) {
    this.timestamp = new Date();
  }
}
