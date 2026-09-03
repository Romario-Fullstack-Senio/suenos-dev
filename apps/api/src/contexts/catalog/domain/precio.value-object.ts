import { ValueObject, DomainError } from '@suenos-dev/shared-kernel';

interface PrecioProps {
  value: number;
  currency: string;
}

export class Precio extends ValueObject<PrecioProps> {
  private constructor(props: PrecioProps) {
    super(props);
  }

  get value(): number {
    return this.props.value;
  }

  get currency(): string {
    return this.props.currency;
  }

  static create(amount: number, currency: string = 'USD'): Precio {
    // TypeORM/pg devuelve columnas numeric/decimal como string (no pierde
    // precisión) — sin este Number(), `value` queda tipado `number` pero
    // en runtime es un string, y cualquier .toFixed()/suma downstream
    // rompe (mismo bug encontrado en Orden.monto, ver orden.typeorm-repository.ts).
    const value = Number(amount);
    if (Number.isNaN(value) || value < 0) throw new DomainError('El precio no puede ser negativo');
    return new Precio({ value, currency });
  }
}
