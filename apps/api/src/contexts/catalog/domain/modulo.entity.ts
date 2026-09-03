import { Entity, DomainError } from '@suenos-dev/shared-kernel';
import { Leccion } from './leccion.entity';

interface ModuloProps {
  titulo: string;
  orden: number;
  lecciones: Leccion[];
}

export class Modulo extends Entity<string> {
  private props: ModuloProps;

  private constructor(id: string, props: ModuloProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, titulo: string, orden: number): Modulo {
    if (!titulo) throw new DomainError('El título del módulo es requerido');
    return new Modulo(id, { titulo, orden, lecciones: [] });
  }

  static reconstitute(id: string, props: ModuloProps): Modulo {
    return new Modulo(id, { ...props });
  }

  get titulo(): string { return this.props.titulo; }
  get orden(): number { return this.props.orden; }
  get lecciones(): ReadonlyArray<Leccion> { return this.props.lecciones; }

  agregarLeccion(leccion: Leccion): void {
    this.props.lecciones.push(leccion);
  }
}
