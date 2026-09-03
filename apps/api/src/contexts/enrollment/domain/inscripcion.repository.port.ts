import { Inscripcion } from './inscripcion.entity';

export const INSCRIPCION_REPOSITORY = 'INSCRIPCION_REPOSITORY';

export interface InscripcionRepository {
  save(inscripcion: Inscripcion): Promise<void>;
  findByCursoYEstudiante(cursoId: string, estudianteId: string): Promise<Inscripcion | null>;
  findAllByEstudiante(estudianteId: string): Promise<Inscripcion[]>;
  findByCursoId(cursoId: string): Promise<Inscripcion[]>;
  findAll(): Promise<Inscripcion[]>;
}
