import { Cupon } from './cupon.entity';

export const CUPON_REPOSITORY = 'CUPON_REPOSITORY';

export interface CuponRepository {
  save(cupon: Cupon): Promise<void>;
  findById(id: string): Promise<Cupon | null>;
  findByCodigo(codigo: string): Promise<Cupon | null>;
  findAll(): Promise<Cupon[]>;
  delete(id: string): Promise<void>;
}
