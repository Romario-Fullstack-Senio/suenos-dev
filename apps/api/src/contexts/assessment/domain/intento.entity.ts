export interface IntentoProps {
  estudianteId: string;
  quizId: string;
  respuestas: number[][];
  puntaje: number;
  aprobado: boolean;
}

export class Intento {
  private props: IntentoProps;

  private constructor(
    private readonly _id: string,
    props: IntentoProps,
  ) {
    this.props = props;
  }

  static crear(id: string, estudianteId: string, quizId: string): Intento {
    return new Intento(id, {
      estudianteId,
      quizId,
      respuestas: [],
      puntaje: 0,
      aprobado: false,
    });
  }

  get id(): string {
    return this._id;
  }

  get estudianteId(): string {
    return this.props.estudianteId;
  }

  get quizId(): string {
    return this.props.quizId;
  }

  get respuestas(): number[][] {
    return this.props.respuestas;
  }

  get puntaje(): number {
    return this.props.puntaje;
  }

  get aprobado(): boolean {
    return this.props.aprobado;
  }

  setRespuestas(respuestas: number[][]): void {
    this.props.respuestas = respuestas;
  }

  setPuntaje(puntaje: number): void {
    this.props.puntaje = puntaje;
  }

  setAprobado(aprobado: boolean): void {
    this.props.aprobado = aprobado;
  }
}
