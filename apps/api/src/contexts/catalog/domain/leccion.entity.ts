import { Entity, DomainError } from '@suenos-dev/shared-kernel';

interface LeccionProps {
  titulo: string;
  orden: number;
  duracionSegundos: number;
  videoUrl?: string;
  esVistaPrevia: boolean;
}

export class Leccion extends Entity<string> {
  private props: LeccionProps;

  private constructor(id: string, props: LeccionProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, titulo: string, orden: number, duracionSegundos: number, esVistaPrevia = false): Leccion {
    if (!titulo) throw new DomainError('El título de la lección es requerido');
    return new Leccion(id, { titulo, orden, duracionSegundos, esVistaPrevia });
  }

  static reconstitute(id: string, props: LeccionProps): Leccion {
    return new Leccion(id, { ...props });
  }

  get titulo(): string { return this.props.titulo; }
  get orden(): number { return this.props.orden; }
  get duracionSegundos(): number { return this.props.duracionSegundos; }
  get videoUrl(): string | undefined { return this.props.videoUrl; }
  /** Curso gratis "de muestra" — accesible sin haber comprado el curso, para
   * reducir la fricción de compra (el clásico "ver una clase gratis"). */
  get esVistaPrevia(): boolean { return this.props.esVistaPrevia; }

  asignarVideo(url: string): void {
    this.props.videoUrl = url;
  }

  marcarComoVistaPrevia(esVistaPrevia: boolean): void {
    this.props.esVistaPrevia = esVistaPrevia;
  }
}
