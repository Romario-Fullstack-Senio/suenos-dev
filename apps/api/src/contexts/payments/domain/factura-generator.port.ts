export const FACTURA_GENERATOR = 'FACTURA_GENERATOR';

export interface FacturaItem {
  nombre: string;
  precio: number;
}

export interface FacturaData {
  numeroComprobante: string;
  fecha: Date;
  compradorNombre: string;
  compradorEmail: string;
  items: FacturaItem[];
  monto: number;
  moneda: string;
  estado: string;
}

export interface FacturaGenerator {
  generate(data: FacturaData): Promise<Buffer>;
}
