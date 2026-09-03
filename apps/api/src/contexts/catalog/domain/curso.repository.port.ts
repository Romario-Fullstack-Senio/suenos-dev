import { Curso } from './curso.entity';

export const CURSO_REPOSITORY = 'CURSO_REPOSITORY';

export interface BuscarCursosFiltros {
  texto?: string;
  categoria?: string;
  nivel?: string;
  ordenarPor?: 'reciente' | 'precio_asc' | 'precio_desc';
  soloPublicados?: boolean;
}

export interface CursoRepository {
  save(curso: Curso): Promise<void>;
  findById(id: string): Promise<Curso | null>;
  findBySlug(slug: string): Promise<Curso | null>;
  findAll(): Promise<Curso[]>;
  findByInstructorId(instructorId: string): Promise<Curso[]>;
  delete(id: string): Promise<void>;
  /** Búsqueda/descubrimiento a nivel de base de datos — no trae `modulos`
   * (no hace falta para listar cards del catálogo, y evita el N+1 join). */
  search(filtros: BuscarCursosFiltros): Promise<Curso[]>;
}
