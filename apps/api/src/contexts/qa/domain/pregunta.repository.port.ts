import { Pregunta } from './pregunta.entity';

export const PREGUNTA_REPOSITORY = 'PREGUNTA_REPOSITORY';

export interface PreguntaRepository {
  save(pregunta: Pregunta): Promise<void>;
  findById(id: string): Promise<Pregunta | null>;
  findByLeccionId(leccionId: string): Promise<Pregunta[]>;
  delete(id: string): Promise<void>;
}
