import { AggregateRoot, DomainError } from '@suenos-dev/shared-kernel';

// A partir de este número de reportes distintos, la reseña se oculta sola
// del listado público — el admin la sigue viendo (y puede restaurarla o
// borrarla) en el panel de moderación.
const UMBRAL_OCULTAR_POR_REPORTES = 3;

export interface ResenaProps {
  cursoId: string;
  estudianteId: string;
  estudianteNombre: string;
  calificacion: number;
  comentario: string | null;
  createdAt: Date;
  updatedAt: Date;
  reportadoPor: string[];
  oculta: boolean;
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

  get reportadoPor(): string[] {
    return this.props.reportadoPor;
  }

  get totalReportes(): number {
    return this.props.reportadoPor.length;
  }

  get oculta(): boolean {
    return this.props.oculta;
  }

  editar(calificacion: number, comentario?: string): void {
    Resena.validarCalificacion(calificacion);
    this.props.calificacion = calificacion;
    this.props.comentario = comentario?.trim() || null;
    this.props.updatedAt = new Date();
    this.touch();
  }

  /** Un mismo usuario no puede inflar el contador reportando varias veces
   * — se guarda quién reportó, no solo un número. Al llegar al umbral, la
   * reseña se oculta sola del listado público sin intervención manual. */
  reportar(usuarioId: string): void {
    if (this.props.estudianteId === usuarioId) {
      throw new DomainError('No podés reportar tu propia reseña');
    }
    if (this.props.reportadoPor.includes(usuarioId)) {
      throw new DomainError('Ya reportaste esta reseña');
    }
    this.props.reportadoPor = [...this.props.reportadoPor, usuarioId];
    if (this.props.reportadoPor.length >= UMBRAL_OCULTAR_POR_REPORTES) {
      this.props.oculta = true;
    }
    this.touch();
  }

  /** El admin revisó los reportes y decidió que la reseña está bien —
   * vuelve a mostrarse y se limpian los reportes (una restauración es un
   * veredicto "no era spam/abuso", no debería quedar a un reporte de
   * volver a ocultarse sola). */
  restaurar(): void {
    this.props.oculta = false;
    this.props.reportadoPor = [];
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
      reportadoPor: [],
      oculta: false,
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
