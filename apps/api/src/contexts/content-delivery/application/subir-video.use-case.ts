import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  VideoStorage,
  VIDEO_STORAGE,
} from '../domain/progreso-leccion.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';

@Injectable()
export class SubirVideoUseCase {
  constructor(
    @Inject(VIDEO_STORAGE)
    private readonly videoStorage: VideoStorage,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
  ) {}

  async execute(file: Buffer, leccionId: string): Promise<string> {
    const url = await this.videoStorage.upload(file, leccionId);

    // El adapter solo transcodifica y sube a MinIO — sin esto, la URL nunca
    // quedaba guardada en la lección, así que ningún curso mostraba video
    // jamás (ni el reproductor de /aprender ni la vista previa gratuita),
    // pese a que la transcodificación y la subida a MinIO funcionaban bien.
    const info = await this.cursoRepository.findInfoByLeccionId(leccionId);
    if (!info) throw new NotFoundException('Lección no encontrada');
    const curso = await this.cursoRepository.findById(info.cursoId);
    if (!curso) throw new NotFoundException('Curso no encontrado');
    const leccion = curso.modulos
      .flatMap((m) => m.lecciones)
      .find((l) => l.id === leccionId);
    if (!leccion) throw new NotFoundException('Lección no encontrada en el curso');
    leccion.asignarVideo(url);
    await this.cursoRepository.save(curso);

    return url;
  }
}
