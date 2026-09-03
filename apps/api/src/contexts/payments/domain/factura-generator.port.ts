export const FACTURA_GENERATOR = 'FACTURA_GENERATOR';

export interface FacturaData {
  numeroComprobante: string;
  fecha: Date;
  compradorNombre: string;
  compradorEmail: string;
  cursoNombre: string;
  monto: number;
  moneda: string;
  estado: string;
}

export interface FacturaGenerator {
  generate(data: FacturaData): Promise<Buffer>;
}
