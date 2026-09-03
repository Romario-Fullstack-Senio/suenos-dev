import { Inject, Injectable } from '@nestjs/common';
import { RESENA_REPOSITORY, ResenaRepository } from '../domain/resena.repository.port';

@Injectable()
export class ListarResenasUseCase {
  constructor(
    @Inject(RESENA_REPOSITORY)
    private readonly resenaRepo: ResenaRepository,
  ) {}

  async execute(cursoId: string) {
    const resenas = await this.resenaRepo.findByCursoId(cursoId);
    const total = resenas.length;
    const promedio = total === 0 ? 0 : Math.round((resenas.reduce((sum, r) => sum + r.calificacion, 0) / total) * 10) / 10;

    return {
      promedio,
      total,
      resenas: resenas.map(r => ({
        id: r.id,
        estudianteNombre: r.estudianteNombre,
        calificacion: r.calificacion,
        comentario: r.comentario,
        createdAt: r.createdAt,
      })),
    };
  }
}
