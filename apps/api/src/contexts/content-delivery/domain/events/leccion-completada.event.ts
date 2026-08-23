export class LeccionCompletada {
  readonly eventName = 'LeccionCompletada';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string,
    readonly cursoId: string,
    readonly estudianteId: string,
  ) {
    this.occurredOn = new Date();
  }
}
