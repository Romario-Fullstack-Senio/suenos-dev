import { Pregunta } from './pregunta.entity';

export const PREGUNTA_REPOSITORY = 'PREGUNTA_REPOSITORY';

export interface PreguntaRepository {
  save(pregunta: Pregunta): Promise<void>;
  findById(id: string): Promise<Pregunta | null>;
  findByLeccionId(leccionId: string): Promise<Pregunta[]>;
  /** Todas las preguntas hechas por un usuario — usado por la exportación
   * de datos (GDPR) del propio usuario. */
  findByAutorId(autorId: string): Promise<Pregunta[]>;
  /** Todas las preguntas de la plataforma — panel de moderación del admin,
   * mismo criterio que ResenaRepository#findAll (el propio admin filtra
   * por "con reportes" del lado de la aplicación). */
  findAll(): Promise<Pregunta[]>;
  delete(id: string): Promise<void>;
}
