import { DomainEvent } from '@suenos-dev/shared-kernel';

export class CursoPublicado implements DomainEvent {
  readonly eventName = 'CursoPublicado';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly titulo: string;
  readonly slug: string;
  readonly descripcion: string;

  constructor(params: {
    cursoId: string;
    titulo: string;
    slug: string;
    descripcion: string;
  }) {
    this.occurredOn = new Date();
    this.aggregateId = params.cursoId;
    this.titulo = params.titulo;
    this.slug = params.slug;
    this.descripcion = params.descripcion;
  }
}
