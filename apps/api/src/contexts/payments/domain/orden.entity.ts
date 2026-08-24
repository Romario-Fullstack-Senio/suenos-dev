import { AggregateRoot } from '@suenos-dev/shared-kernel';
import { CursoCompradoEvent } from './events/curso-comprado.event';

export type OrdenEstado = 'pendiente' | 'completada' | 'fallida';

export interface OrdenProps {
  estudianteId: string;
  cursoId: string;
  monto: number;
  moneda: string;
  stripeSessionId: string;
  estado: OrdenEstado;
}

export class Orden extends AggregateRoot<string> {
  private props: OrdenProps;

  private constructor(id: string, props: OrdenProps) {
    super(id);
    this.props = props;
  }

  get estudianteId(): string {
    return this.props.estudianteId;
  }

  get cursoId(): string {
    return this.props.cursoId;
  }

  get monto(): number {
    return this.props.monto;
  }

  get moneda(): string {
    return this.props.moneda;
  }

  get stripeSessionId(): string {
    return this.props.stripeSessionId;
  }

  get estado(): OrdenEstado {
    return this.props.estado;
  }

  completar(metadata?: {
    alumnoEmail?: string;
    alumnoNombre?: string;
    cursoNombre?: string;
    precio?: number;
  }): void {
    this.props.estado = 'completada';
    this.touch();
    this.addDomainEvent({
      eventName: 'CursoComprado',
      occurredOn: new Date(),
      aggregateId: this.id,
      estudianteId: this.props.estudianteId,
      cursoId: this.props.cursoId,
      alumnoEmail: metadata?.alumnoEmail || '',
      alumnoNombre: metadata?.alumnoNombre || '',
      cursoNombre: metadata?.cursoNombre || '',
      precio: metadata?.precio || this.props.monto,
    } as CursoCompradoEvent);
  }

  static crear(
    id: string,
    estudianteId: string,
    cursoId: string,
    monto: number,
    moneda: string,
    stripeSessionId: string,
  ): Orden {
    return new Orden(id, {
      estudianteId,
      cursoId,
      monto,
      moneda,
      stripeSessionId,
      estado: 'pendiente',
    });
  }

  static restore(
    id: string,
    estudianteId: string,
    cursoId: string,
    monto: number,
    moneda: string,
    stripeSessionId: string,
    estado: OrdenEstado,
  ): Orden {
    return new Orden(id, {
      estudianteId,
      cursoId,
      monto,
      moneda,
      stripeSessionId,
      estado,
    });
  }
}
