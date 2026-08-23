import { ProgresoLeccion } from './progreso-leccion.entity';

export const PROGRESO_LECCION_REPOSITORY = 'PROGRESO_LECCION_REPOSITORY';
export const VIDEO_STORAGE = 'VIDEO_STORAGE';

export interface ProgresoLeccionRepository {
  save(progreso: ProgresoLeccion): Promise<void>;
  findByLeccionYEstudiante(
    leccionId: string,
    estudianteId: string,
  ): Promise<ProgresoLeccion | null>;
  findByCursoYEstudiante(
    cursoId: string,
    estudianteId: string,
  ): Promise<ProgresoLeccion[]>;
}

export interface VideoStorage {
  upload(file: Buffer, key: string): Promise<string>;
  getStreamUrl(key: string): Promise<string>;
}
