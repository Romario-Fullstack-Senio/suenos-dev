import { Entity } from '@suenos-dev/shared-kernel';

interface LeccionProps {
  titulo: string;
  orden: number;
  duracionSegundos: number;
  videoUrl?: string;
}

export class Leccion extends Entity<string> {
  private props: LeccionProps;

  private constructor(id: string, props: LeccionProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, titulo: string, orden: number, duracionSegundos: number): Leccion {
    if (!titulo) throw new Error('El título de la lección es requerido');
    return new Leccion(id, { titulo, orden, duracionSegundos });
  }

  static reconstitute(id: string, props: LeccionProps): Leccion {
    return new Leccion(id, { ...props });
  }

  get titulo(): string { return this.props.titulo; }
  get orden(): number { return this.props.orden; }
  get duracionSegundos(): number { return this.props.duracionSegundos; }
  get videoUrl(): string | undefined { return this.props.videoUrl; }

  asignarVideo(url: string): void {
    this.props.videoUrl = url;
  }
}
