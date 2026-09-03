import { AggregateRoot, DomainError } from '@suenos-dev/shared-kernel';

export interface ResenaProps {
  cursoId: string;
  estudianteId: string;
  estudianteNombre: string;
  calificacion: number;
  comentario: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Resena extends AggregateRoot<string> {
  private props: ResenaProps;

  private constructor(id: string, props: ResenaProps) {
    super(id);
    this.props = props;
  }

  get cursoId(): string {
    return this.props.cursoId;
  }

  get estudianteId(): string {
    return this.props.estudianteId;
  }

  get estudianteNombre(): string {
    return this.props.estudianteNombre;
  }

  get calificacion(): number {
    return this.props.calificacion;
  }

  get comentario(): string | null {
    return this.props.comentario;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  editar(calificacion: number, comentario?: string): void {
    Resena.validarCalificacion(calificacion);
    this.props.calificacion = calificacion;
    this.props.comentario = comentario?.trim() || null;
    this.props.updatedAt = new Date();
    this.touch();
  }

  static crear(
    id: string,
    params: { cursoId: string; estudianteId: string; estudianteNombre: string; calificacion: number; comentario?: string },
  ): Resena {
    Resena.validarCalificacion(params.calificacion);
    const now = new Date();
    return new Resena(id, {
      cursoId: params.cursoId,
      estudianteId: params.estudianteId,
      estudianteNombre: params.estudianteNombre,
      calificacion: params.calificacion,
      comentario: params.comentario?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: ResenaProps): Resena {
    return new Resena(id, props);
  }

  private static validarCalificacion(calificacion: number): void {
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      throw new DomainError('La calificación debe ser un número entero entre 1 y 5');
    }
  }
}
