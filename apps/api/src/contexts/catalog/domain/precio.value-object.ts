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
    if (amount < 0) throw new DomainError('El precio no puede ser negativo');
    return new Precio({ value: amount, currency });
  }
}
