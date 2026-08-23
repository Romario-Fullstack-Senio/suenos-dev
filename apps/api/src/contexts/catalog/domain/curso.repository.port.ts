import { Curso } from './curso.entity';

export const CURSO_REPOSITORY = 'CURSO_REPOSITORY';

export interface CursoRepository {
  save(curso: Curso): Promise<void>;
  findById(id: string): Promise<Curso | null>;
  findBySlug(slug: string): Promise<Curso | null>;
  findAll(): Promise<Curso[]>;
  findByInstructorId(instructorId: string): Promise<Curso[]>;
}
