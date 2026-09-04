import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  VideoStorage,
  VIDEO_STORAGE,
} from '../domain/progreso-leccion.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';

@Injectable()
export class SubirRecursoUseCase {
  constructor(
    @Inject(VIDEO_STORAGE)
    private readonly videoStorage: VideoStorage,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
  ) {}

  async execute(file: Buffer, leccionId: string, nombre: string, nombreArchivoOriginal: string): Promise<string> {
    const info = await this.cursoRepository.findInfoByLeccionId(leccionId);
    if (!info) throw new NotFoundException('Lección no encontrada');
    const curso = await this.cursoRepository.findById(info.cursoId);
    if (!curso) throw new NotFoundException('Curso no encontrado');
    const leccion = curso.modulos
      .flatMap((m) => m.lecciones)
      .find((l) => l.id === leccionId);
    if (!leccion) throw new NotFoundException('Lección no encontrada en el curso');

    // Si ya hay un recurso con ese nombre de archivo en esta lección, le
    // agregamos un prefijo corto en vez de pisarlo silenciosamente en MinIO
    // (dos PDFs distintos llamados "guia.pdf" no deberían fusionarse en uno).
    const yaExiste = leccion.recursos.some((r) => r.archivo === nombreArchivoOriginal);
    const archivo = yaExiste ? `${randomUUID().slice(0, 8)}-${nombreArchivoOriginal}` : nombreArchivoOriginal;

    const url = await this.videoStorage.uploadRecurso(file, leccionId, archivo);
    leccion.agregarRecurso({ nombre, archivo, url });
    await this.cursoRepository.save(curso);

    return url;
  }
}
