export class PorcentajeVisto {
  private constructor(private readonly _value: number) {}

  get value(): number {
    return this._value;
  }

  static create(value: number): PorcentajeVisto {
    if (value < 0 || value > 100) {
      throw new Error('El porcentaje debe estar entre 0 y 100');
    }
    return new PorcentajeVisto(value);
  }
}
