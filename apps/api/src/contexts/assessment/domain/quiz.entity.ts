import { AggregateRoot } from '@suenos-dev/shared-kernel';
import { Pregunta } from './pregunta.entity';

export interface QuizProps {
  titulo: string;
  cursoId: string;
  preguntas: Pregunta[];
  puntajeMinimo: number;
}

export class Quiz extends AggregateRoot<string> {
  private props: QuizProps;

  private constructor(id: string, props: QuizProps) {
    super(id);
    this.props = props;
  }

  static crear(id: string, titulo: string, cursoId: string, puntajeMinimo: number): Quiz {
    return new Quiz(id, {
      titulo,
      cursoId,
      preguntas: [],
      puntajeMinimo,
    });
  }

  static reconstitute(id: string, props: QuizProps): Quiz {
    return new Quiz(id, { ...props });
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get cursoId(): string {
    return this.props.cursoId;
  }

  get preguntas(): Pregunta[] {
    return this.props.preguntas;
  }

  get puntajeMinimo(): number {
    return this.props.puntajeMinimo;
  }

  agregarPregunta(pregunta: Pregunta): void {
    this.props.preguntas.push(pregunta);
    this.touch();
  }

  /**
   * Corrige y devuelve solo si aprobó — pura lógica de dominio, sin efectos
   * secundarios. Publicar el evento QuizAprobado (con nombres de estudiante/
   * curso incluidos, que este agregado no conoce) es responsabilidad de
   * ResolverQuizUseCase, que sí puede consultar esos otros contextos.
   */
  resolver(respuestas: number[]): boolean {
    let respuestasCorrectas = 0;
    for (let i = 0; i < this.props.preguntas.length; i++) {
      const pregunta = this.props.preguntas[i];
      if (pregunta.verificar(respuestas[i])) {
        respuestasCorrectas++;
      }
    }
    const totalPreguntas = this.props.preguntas.length;
    const puntaje = totalPreguntas > 0 ? (respuestasCorrectas / totalPreguntas) * 100 : 0;
    return puntaje >= this.props.puntajeMinimo;
  }
}
