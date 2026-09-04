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
  findByCursoId(cursoId: string): Promise<ProgresoLeccion[]>;
}

export interface VideoObjectStream {
  stream: NodeJS.ReadableStream;
  contentType: string;
}

export interface VideoStorage {
  upload(file: Buffer, key: string): Promise<string>;
  getStreamUrl(key: string): Promise<string>;
  /** Lee un archivo (manifest .m3u8 o segmento .ts) ya subido a MinIO, para
   * servirlo a través de nuestro propio endpoint con control de acceso —
   * nunca se expone la URL de MinIO directo (el bucket es privado acá,
   * a diferencia de covers/*). */
  getObject(key: string, filename: string): Promise<VideoObjectStream | null>;
  /** Sube un archivo .vtt de subtítulos para la lección `key`. Mismo bucket
   * privado que el video, servido por el mismo control de acceso. */
  uploadSubtitulos(file: Buffer, key: string): Promise<string>;
  getSubtitulos(key: string): Promise<VideoObjectStream | null>;
}
