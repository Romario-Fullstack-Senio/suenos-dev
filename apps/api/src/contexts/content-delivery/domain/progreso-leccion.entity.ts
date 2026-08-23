import { AggregateRoot } from '@suenos-dev/shared-kernel';
import { PorcentajeVisto } from './porcentaje-visto.value-object';

export interface ProgresoLeccionProps {
  estudianteId: string;
  leccionId: string;
  cursoId: string;
  porcentaje: PorcentajeVisto;
  completada: boolean;
}

export class ProgresoLeccion extends AggregateRoot<string> {
  private props: ProgresoLeccionProps;

  private constructor(id: string, props: ProgresoLeccionProps) {
    super(id);
    this.props = props;
  }

  static create(
    id: string,
    estudianteId: string,
    leccionId: string,
    cursoId: string,
  ): ProgresoLeccion {
    return new ProgresoLeccion(id, {
      estudianteId,
      leccionId,
      cursoId,
      porcentaje: PorcentajeVisto.create(0),
      completada: false,
    });
  }

  static reconstitute(
    id: string,
    estudianteId: string,
    leccionId: string,
    cursoId: string,
    porcentaje: PorcentajeVisto,
    completada: boolean,
  ): ProgresoLeccion {
    return new ProgresoLeccion(id, {
      estudianteId,
      leccionId,
      cursoId,
      porcentaje,
      completada,
    });
  }

  get estudianteId(): string {
    return this.props.estudianteId;
  }

  get leccionId(): string {
    return this.props.leccionId;
  }

  get cursoId(): string {
    return this.props.cursoId;
  }

  get porcentaje(): PorcentajeVisto {
    return this.props.porcentaje;
  }

  get completada(): boolean {
    return this.props.completada;
  }

  registrarProgreso(segundosVistos: number, duracionTotal: number): void {
    const nuevoPorcentaje = Math.min(
      100,
      Math.round((segundosVistos / duracionTotal) * 100),
    );
    this.props.porcentaje = PorcentajeVisto.create(nuevoPorcentaje);
    this.touch();

    if (nuevoPorcentaje >= 90 && !this.props.completada) {
      this.props.completada = true;
      this.addDomainEvent({
        eventName: 'LeccionCompletada',
        occurredOn: new Date(),
        aggregateId: this.id,
      });
    }
  }
}
