import { AggregateRoot } from '@suenos-dev/shared-kernel';
import { Precio } from './precio.value-object';
import { Slug } from './slug.value-object';
import { EstadoCurso } from './estado-curso.value-object';
import { Modulo } from './modulo.entity';
import { CursoPublicado } from './events/curso-publicado.event';

interface CursoProps {
  titulo: string;
  descripcion: string;
  precio: Precio;
  slug: Slug;
  estado: EstadoCurso;
  instructorId: string;
  modulos: Modulo[];
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
  }): Curso {
    if (!params.titulo || params.titulo.length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }
    return new Curso(id, {
      titulo: params.titulo,
      descripcion: params.descripcion,
      precio: Precio.create(params.precio),
      slug: Slug.from(params.titulo),
      estado: EstadoCurso.borrador(),
      instructorId: params.instructorId,
      modulos: [],
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

  publicar(): void {
    if (this.props.modulos.length === 0) {
      throw new Error('Un curso debe tener al menos un módulo para ser publicado');
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

  agregarModulo(modulo: Modulo): void {
    this.props.modulos.push(modulo);
    this.touch();
  }

  agregarLeccion(moduloId: string, leccion: import('./leccion.entity').Leccion): void {
    const modulo = this.props.modulos.find(m => m.id === moduloId);
    if (!modulo) {
      throw new Error(`Módulo ${moduloId} no encontrado en el curso`);
    }
    modulo.agregarLeccion(leccion);
    this.touch();
  }
}
