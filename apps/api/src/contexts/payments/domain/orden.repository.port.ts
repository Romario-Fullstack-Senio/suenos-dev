import { Orden } from './orden.entity';

export const ORDEN_REPOSITORY = 'ORDEN_REPOSITORY';

export interface OrdenRepository {
  save(orden: Orden): Promise<void>;
  findById(id: string): Promise<Orden | null>;
  findByStripeSessionId(sessionId: string): Promise<Orden | null>;
}
