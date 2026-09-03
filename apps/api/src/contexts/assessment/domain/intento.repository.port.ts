import { Intento } from './intento.entity';

export const INTENTO_REPOSITORY = 'INTENTO_REPOSITORY';

export interface IntentoRepository {
  save(intento: Intento): Promise<void>;
}
