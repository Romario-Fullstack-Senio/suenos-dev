import { Paquete } from './paquete.entity';

export const PAQUETE_REPOSITORY = 'PAQUETE_REPOSITORY';

export interface PaqueteRepository {
  save(paquete: Paquete): Promise<void>;
  findById(id: string): Promise<Paquete | null>;
  findAll(soloActivos?: boolean): Promise<Paquete[]>;
  delete(id: string): Promise<void>;
}
