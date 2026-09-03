import { Resena } from './resena.entity';

export const RESENA_REPOSITORY = 'RESENA_REPOSITORY';

export interface ResumenResenas {
  cursoId: string;
  promedio: number;
  total: number;
}

export interface ResenaRepository {
  save(resena: Resena): Promise<void>;
  findById(id: string): Promise<Resena | null>;
  findByCursoYEstudiante(cursoId: string, estudianteId: string): Promise<Resena | null>;
  findByCursoId(cursoId: string): Promise<Resena[]>;
  delete(id: string): Promise<void>;
  /** Promedio y conteo agrupados por curso, para varios cursos a la vez
   * (usado por el listado de cursos, que no quiere hacer N+1 requests). */
  resumenPorCursos(cursoIds: string[]): Promise<ResumenResenas[]>;
}
