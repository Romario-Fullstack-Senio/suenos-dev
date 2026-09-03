import { AggregateRoot } from '@suenos-dev/shared-kernel';

export interface InscripcionProps {
  estudianteId: string;
  cursoId: string;
  fechaInscripcion: Date;
  activa: boolean;
}

export class Inscripcion extends AggregateRoot<string> {
  private props: InscripcionProps;

  private constructor(id: string, props: InscripcionProps) {
    super(id);
    this.props = props;
  }

  get estudianteId(): string {
    return this.props.estudianteId;
  }

  get cursoId(): string {
    return this.props.cursoId;
  }

  get fechaInscripcion(): Date {
    return this.props.fechaInscripcion;
  }

  get activa(): boolean {
    return this.props.activa;
  }

  desactivar(): void {
    this.props.activa = false;
    this.touch();
  }

  activar(): void {
    this.props.activa = true;
    this.touch();
  }

  static crear(id: string, estudianteId: string, cursoId: string): Inscripcion {
    return new Inscripcion(id, {
      estudianteId,
      cursoId,
      fechaInscripcion: new Date(),
      activa: true,
    });
  }

  static reconstitute(id: string, props: InscripcionProps): Inscripcion {
    return new Inscripcion(id, props);
  }
}
