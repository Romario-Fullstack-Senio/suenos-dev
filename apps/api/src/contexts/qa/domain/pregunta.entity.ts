import { AggregateRoot, DomainError } from '@suenos-dev/shared-kernel';
import { Respuesta } from './respuesta.entity';

// Mismo umbral y misma lógica que Resena — ver el comentario ahí.
const UMBRAL_OCULTAR_POR_REPORTES = 3;

interface PreguntaProps {
  cursoId: string;
  leccionId: string;
  autorId: string;
  autorNombre: string;
  autorEsInstructor: boolean;
  texto: string;
  resuelta: boolean;
  respuestas: Respuesta[];
  createdAt: Date;
  reportadoPor: string[];
  oculta: boolean;
}

export class Pregunta extends AggregateRoot<string> {
  private props: PreguntaProps;

  private constructor(id: string, props: PreguntaProps) {
    super(id);
    this.props = props;
  }

  static crear(
    id: string,
    params: {
      cursoId: string;
      leccionId: string;
      autorId: string;
      autorNombre: string;
      autorEsInstructor: boolean;
      texto: string;
    },
  ): Pregunta {
    const texto = params.texto?.trim();
    if (!texto) throw new DomainError('La pregunta no puede estar vacía');
    if (texto.length > 2000) throw new DomainError('La pregunta es demasiado larga (máx. 2000 caracteres)');
    return new Pregunta(id, {
      cursoId: params.cursoId,
      leccionId: params.leccionId,
      autorId: params.autorId,
      autorNombre: params.autorNombre,
      autorEsInstructor: params.autorEsInstructor,
      texto,
      resuelta: false,
      respuestas: [],
      createdAt: new Date(),
      reportadoPor: [],
      oculta: false,
    });
  }

  static reconstitute(id: string, props: PreguntaProps): Pregunta {
    return new Pregunta(id, { ...props, respuestas: [...props.respuestas] });
  }

  get cursoId(): string { return this.props.cursoId; }
  get leccionId(): string { return this.props.leccionId; }
  get autorId(): string { return this.props.autorId; }
  get autorNombre(): string { return this.props.autorNombre; }
  get autorEsInstructor(): boolean { return this.props.autorEsInstructor; }
  get texto(): string { return this.props.texto; }
  get resuelta(): boolean { return this.props.resuelta; }
  get respuestas(): Respuesta[] { return this.props.respuestas; }
  get createdAt(): Date { return this.props.createdAt; }
  get reportadoPor(): string[] { return this.props.reportadoPor; }
  get totalReportes(): number { return this.props.reportadoPor.length; }
  get oculta(): boolean { return this.props.oculta; }

  /** Mismo criterio que Resena#reportar: se guarda quién reportó (no un
   * contador), y al llegar al umbral se oculta sola del Q&A público. */
  reportar(usuarioId: string): void {
    if (this.props.autorId === usuarioId) {
      throw new DomainError('No podés reportar tu propia pregunta');
    }
    if (this.props.reportadoPor.includes(usuarioId)) {
      throw new DomainError('Ya reportaste esta pregunta');
    }
    this.props.reportadoPor = [...this.props.reportadoPor, usuarioId];
    if (this.props.reportadoPor.length >= UMBRAL_OCULTAR_POR_REPORTES) {
      this.props.oculta = true;
    }
    this.touch();
  }

  restaurar(): void {
    this.props.oculta = false;
    this.props.reportadoPor = [];
    this.touch();
  }

  agregarRespuesta(respuesta: Respuesta): void {
    this.props.respuestas.push(respuesta);
    // Una respuesta del instructor/admin resuelve la pregunta automáticamente
    // — un alumno respondiendo a otro alumno no la marca como resuelta.
    if (respuesta.autorEsInstructor) {
      this.props.resuelta = true;
    }
    this.touch();
  }

  marcarResuelta(resuelta: boolean): void {
    this.props.resuelta = resuelta;
    this.touch();
  }
}
