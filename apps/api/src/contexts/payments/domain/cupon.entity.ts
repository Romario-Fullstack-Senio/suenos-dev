import { AggregateRoot, DomainError } from '@suenos-dev/shared-kernel';

export const TIPOS_CUPON = ['porcentaje', 'monto_fijo'] as const;
export type TipoCupon = (typeof TIPOS_CUPON)[number];

export interface CuponProps {
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  activo: boolean;
  cursoId?: string; // undefined = cupón global, aplica a cualquier curso
  fechaExpiracion?: Date;
  usosMaximos?: number;
  usosActuales: number;
}

export interface ResultadoValidacionCupon {
  valido: boolean;
  motivo?: string;
}

export class Cupon extends AggregateRoot<string> {
  private props: CuponProps;

  private constructor(id: string, props: CuponProps) {
    super(id);
    this.props = props;
  }

  get codigo(): string {
    return this.props.codigo;
  }

  get tipo(): TipoCupon {
    return this.props.tipo;
  }

  get valor(): number {
    return this.props.valor;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  get cursoId(): string | undefined {
    return this.props.cursoId;
  }

  get fechaExpiracion(): Date | undefined {
    return this.props.fechaExpiracion;
  }

  get usosMaximos(): number | undefined {
    return this.props.usosMaximos;
  }

  get usosActuales(): number {
    return this.props.usosActuales;
  }

  /** Chequea si el cupón puede usarse para un curso dado, sin efectos secundarios. */
  esValidoPara(cursoId: string): ResultadoValidacionCupon {
    if (!this.props.activo) {
      return { valido: false, motivo: 'Este cupón ya no está activo' };
    }
    if (this.props.fechaExpiracion && this.props.fechaExpiracion.getTime() < Date.now()) {
      return { valido: false, motivo: 'Este cupón ha expirado' };
    }
    if (this.props.usosMaximos !== undefined && this.props.usosActuales >= this.props.usosMaximos) {
      return { valido: false, motivo: 'Este cupón alcanzó su límite de usos' };
    }
    if (this.props.cursoId && this.props.cursoId !== cursoId) {
      return { valido: false, motivo: 'Este cupón no aplica a este curso' };
    }
    return { valido: true };
  }

  /** Descuento en la misma moneda que `precio`, nunca negativo ni mayor al precio. */
  calcularDescuento(precio: number): number {
    const bruto = this.props.tipo === 'porcentaje' ? (precio * this.props.valor) / 100 : this.props.valor;
    return Math.min(Math.max(bruto, 0), precio);
  }

  registrarUso(): void {
    this.props.usosActuales += 1;
    this.touch();
  }

  desactivar(): void {
    this.props.activo = false;
    this.touch();
  }

  static crear(
    id: string,
    params: {
      codigo: string;
      tipo: TipoCupon;
      valor: number;
      cursoId?: string;
      fechaExpiracion?: Date;
      usosMaximos?: number;
    },
  ): Cupon {
    const codigo = params.codigo.trim().toUpperCase();
    if (codigo.length < 3) {
      throw new DomainError('El código del cupón debe tener al menos 3 caracteres');
    }
    if (params.tipo === 'porcentaje' && (params.valor <= 0 || params.valor > 100)) {
      throw new DomainError('El descuento porcentual debe estar entre 1 y 100');
    }
    if (params.tipo === 'monto_fijo' && params.valor <= 0) {
      throw new DomainError('El monto de descuento debe ser positivo');
    }
    if (params.usosMaximos !== undefined && params.usosMaximos <= 0) {
      throw new DomainError('El límite de usos debe ser positivo');
    }

    return new Cupon(id, {
      codigo,
      tipo: params.tipo,
      valor: params.valor,
      activo: true,
      cursoId: params.cursoId,
      fechaExpiracion: params.fechaExpiracion,
      usosMaximos: params.usosMaximos,
      usosActuales: 0,
    });
  }

  static reconstitute(id: string, props: CuponProps): Cupon {
    return new Cupon(id, props);
  }
}
