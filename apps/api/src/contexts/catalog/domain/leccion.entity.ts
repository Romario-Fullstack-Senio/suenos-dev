import { Entity, DomainError } from '@suenos-dev/shared-kernel';

export interface RecursoLeccion {
  nombre: string;
  archivo: string; // nombre del archivo en el storage — identifica el recurso para borrarlo después
  url: string;
}

interface LeccionProps {
  titulo: string;
  orden: number;
  duracionSegundos: number;
  videoUrl?: string;
  subtitulosUrl?: string;
  recursos: RecursoLeccion[];
  esVistaPrevia: boolean;
  // Liberación programada ("drip"): 0 = disponible apenas te inscribís
  // (default, comportamiento de siempre). N > 0 = se habilita recién a
  // los N días de la fecha de inscripción DE CADA ALUMNO — no una fecha
  // de calendario fija, así que no importa cuándo se inscriba cada quien.
  diasDesdeInscripcion: number;
}

export class Leccion extends Entity<string> {
  private props: LeccionProps;

  private constructor(id: string, props: LeccionProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, titulo: string, orden: number, duracionSegundos: number, esVistaPrevia = false): Leccion {
    if (!titulo) throw new DomainError('El título de la lección es requerido');
    return new Leccion(id, { titulo, orden, duracionSegundos, esVistaPrevia, recursos: [], diasDesdeInscripcion: 0 });
  }

  static reconstitute(id: string, props: LeccionProps): Leccion {
    return new Leccion(id, { ...props, recursos: props.recursos ?? [], diasDesdeInscripcion: props.diasDesdeInscripcion ?? 0 });
  }

  get titulo(): string { return this.props.titulo; }
  get orden(): number { return this.props.orden; }
  get duracionSegundos(): number { return this.props.duracionSegundos; }
  get videoUrl(): string | undefined { return this.props.videoUrl; }
  get subtitulosUrl(): string | undefined { return this.props.subtitulosUrl; }
  get recursos(): RecursoLeccion[] { return this.props.recursos; }
  /** Curso gratis "de muestra" — accesible sin haber comprado el curso, para
   * reducir la fricción de compra (el clásico "ver una clase gratis"). */
  get esVistaPrevia(): boolean { return this.props.esVistaPrevia; }
  get diasDesdeInscripcion(): number { return this.props.diasDesdeInscripcion; }

  asignarVideo(url: string): void {
    this.props.videoUrl = url;
  }

  asignarSubtitulos(url: string): void {
    this.props.subtitulosUrl = url;
  }

  agregarRecurso(recurso: RecursoLeccion): void {
    this.props.recursos.push(recurso);
  }

  quitarRecurso(archivo: string): void {
    this.props.recursos = this.props.recursos.filter((r) => r.archivo !== archivo);
  }

  marcarComoVistaPrevia(esVistaPrevia: boolean): void {
    this.props.esVistaPrevia = esVistaPrevia;
  }

  asignarDiasDesdeInscripcion(dias: number): void {
    if (dias < 0) throw new DomainError('Los días no pueden ser negativos');
    this.props.diasDesdeInscripcion = Math.floor(dias);
  }
}
