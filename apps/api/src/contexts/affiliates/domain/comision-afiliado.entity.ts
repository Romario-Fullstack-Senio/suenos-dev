import { AggregateRoot, DomainError } from '@suenos-dev/shared-kernel';

// Regla de negocio fija (no configurable por admin todavía, ver
// comentario en el módulo): 20% del precio pagado por el curso referido.
export const PORCENTAJE_COMISION = 20;

export type EstadoComision = 'pendiente' | 'pagada';

interface ComisionAfiliadoProps {
  afiliadoId: string;
  referidoId: string;
  cursoId: string;
  cursoNombre: string;
  ordenId: string;
  monto: number;
  comisionMonto: number;
  estado: EstadoComision;
  createdAt: Date;
}

export class ComisionAfiliado extends AggregateRoot<string> {
  private props: ComisionAfiliadoProps;

  private constructor(id: string, props: ComisionAfiliadoProps) {
    super(id);
    this.props = props;
  }

  static crear(
    id: string,
    params: { afiliadoId: string; referidoId: string; cursoId: string; cursoNombre: string; ordenId: string; monto: number },
  ): ComisionAfiliado {
    if (params.afiliadoId === params.referidoId) {
      throw new DomainError('Un usuario no puede cobrar comisión por su propia compra');
    }
    const comisionMonto = Math.round(params.monto * (PORCENTAJE_COMISION / 100) * 100) / 100;
    return new ComisionAfiliado(id, {
      ...params,
      comisionMonto,
      estado: 'pendiente',
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: ComisionAfiliadoProps): ComisionAfiliado {
    return new ComisionAfiliado(id, props);
  }

  get afiliadoId(): string { return this.props.afiliadoId; }
  get referidoId(): string { return this.props.referidoId; }
  get cursoId(): string { return this.props.cursoId; }
  get cursoNombre(): string { return this.props.cursoNombre; }
  get ordenId(): string { return this.props.ordenId; }
  get monto(): number { return this.props.monto; }
  get comisionMonto(): number { return this.props.comisionMonto; }
  get estado(): EstadoComision { return this.props.estado; }
  get createdAt(): Date { return this.props.createdAt; }

  marcarPagada(): void {
    if (this.props.estado === 'pagada') {
      throw new DomainError('Esta comisión ya estaba marcada como pagada');
    }
    this.props.estado = 'pagada';
    this.touch();
  }
}
