import { Orden } from './orden.entity';

export const ORDEN_REPOSITORY = 'ORDEN_REPOSITORY';

export interface OrdenRepository {
  save(orden: Orden): Promise<void>;
  findById(id: string): Promise<Orden | null>;
  findByStripeSessionId(sessionId: string): Promise<Orden | null>;
  findByEstudianteId(estudianteId: string): Promise<Orden[]>;
  findByCursoIds(cursoIds: string[]): Promise<Orden[]>;
  findAll(): Promise<Orden[]>;
}
