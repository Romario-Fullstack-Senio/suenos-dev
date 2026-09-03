import { AggregateRoot, DomainError, NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { Precio } from './precio.value-object';
import { Slug } from './slug.value-object';
import { EstadoCurso } from './estado-curso.value-object';
import { Modulo } from './modulo.entity';
import { CursoPublicado } from './events/curso-publicado.event';

export const NIVELES_CURSO = ['principiante', 'intermedio', 'avanzado'] as const;
export type NivelCurso = (typeof NIVELES_CURSO)[number];

interface CursoProps {
  titulo: string;
  descripcion: string;
  precio: Precio;
  slug: Slug;
  estado: EstadoCurso;
  instructorId: string;
  modulos: Modulo[];
  imagenUrl?: string;
  categoria?: string;
  nivel?: NivelCurso;
  objetivos: string[];
  requisitos: string[];
  audiencia?: string;
}

export class Curso extends AggregateRoot<string> {
  private props: CursoProps;

  private constructor(id: string, props: CursoProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, params: {
    titulo: string;
    descripcion: string;
    precio: number;
    instructorId: string;
    imagenUrl?: string;
    categoria?: string;
    nivel?: NivelCurso;
    objetivos?: string[];
    requisitos?: string[];
    audiencia?: string;
  }): Curso {
    if (!params.titulo || params.titulo.length < 3) {
      throw new DomainError('El título debe tener al menos 3 caracteres');
    }
    return new Curso(id, {
      titulo: params.titulo,
      descripcion: params.descripcion,
      precio: Precio.create(params.precio),
      slug: Slug.from(params.titulo),
      estado: EstadoCurso.borrador(),
      instructorId: params.instructorId,
      modulos: [],
      imagenUrl: params.imagenUrl,
      categoria: params.categoria,
      nivel: params.nivel,
      objetivos: params.objetivos ?? [],
      requisitos: params.requisitos ?? [],
      audiencia: params.audiencia,
    });
  }

  static reconstitute(id: string, props: CursoProps): Curso {
    return new Curso(id, { ...props });
  }

  get titulo(): string { return this.props.titulo; }
  get descripcion(): string { return this.props.descripcion; }
  get precio(): Precio { return this.props.precio; }
  get slug(): Slug { return this.props.slug; }
  get estado(): EstadoCurso { return this.props.estado; }
  get instructorId(): string { return this.props.instructorId; }
  get modulos(): ReadonlyArray<Modulo> { return this.props.modulos; }
  get imagenUrl(): string | undefined { return this.props.imagenUrl; }
  get categoria(): string | undefined { return this.props.categoria; }
  get nivel(): NivelCurso | undefined { return this.props.nivel; }
  get objetivos(): ReadonlyArray<string> { return this.props.objetivos; }
  get requisitos(): ReadonlyArray<string> { return this.props.requisitos; }
  get audiencia(): string | undefined { return this.props.audiencia; }

  publicar(): void {
    if (this.props.modulos.length === 0) {
      throw new DomainError('Un curso debe tener al menos un módulo para ser publicado');
    }
    this.props.estado = EstadoCurso.publicado();
    this.touch();
    this.addDomainEvent(new CursoPublicado({
      cursoId: this.id,
      titulo: this.props.titulo,
      slug: this.props.slug.value,
      descripcion: this.props.descripcion,
    }));
  }

  /** Vuelve el curso a borrador. A diferencia de publicar(), no tiene
   * restricciones ni emite evento — es solo ocultarlo del catálogo público. */
  despublicar(): void {
    this.props.estado = EstadoCurso.borrador();
    this.touch();
  }

  actualizar(params: {
    titulo?: string;
    descripcion?: string;
    precio?: number;
    imagenUrl?: string;
    categoria?: string;
    nivel?: NivelCurso;
    objetivos?: string[];
    requisitos?: string[];
    audiencia?: string;
  }): void {
    if (params.titulo !== undefined) {
      if (params.titulo.length < 3) {
        throw new DomainError('El título debe tener al menos 3 caracteres');
      }
      this.props.titulo = params.titulo;
      this.props.slug = Slug.from(params.titulo);
    }
    if (params.descripcion !== undefined) {
      this.props.descripcion = params.descripcion;
    }
    if (params.precio !== undefined) {
      this.props.precio = Precio.create(params.precio, this.props.precio.currency);
    }
    if (params.imagenUrl !== undefined) {
      this.props.imagenUrl = params.imagenUrl;
    }
    if (params.categoria !== undefined) {
      this.props.categoria = params.categoria;
    }
    if (params.nivel !== undefined) {
      this.props.nivel = params.nivel;
    }
    if (params.objetivos !== undefined) {
      this.props.objetivos = params.objetivos;
    }
    if (params.requisitos !== undefined) {
      this.props.requisitos = params.requisitos;
    }
    if (params.audiencia !== undefined) {
      this.props.audiencia = params.audiencia;
    }
    this.touch();
  }

  agregarModulo(modulo: Modulo): void {
    this.props.modulos.push(modulo);
    this.touch();
  }

  agregarLeccion(moduloId: string, leccion: import('./leccion.entity').Leccion): void {
    const modulo = this.props.modulos.find(m => m.id === moduloId);
    if (!modulo) {
      throw new NotFoundDomainError(`Módulo ${moduloId} no encontrado en el curso`);
    }
    modulo.agregarLeccion(leccion);
    this.touch();
  }
}
