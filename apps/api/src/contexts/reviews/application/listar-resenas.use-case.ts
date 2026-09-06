import { Inject, Injectable } from '@nestjs/common';
import { RESENA_REPOSITORY, ResenaRepository } from '../domain/resena.repository.port';

@Injectable()
export class ListarResenasUseCase {
  constructor(
    @Inject(RESENA_REPOSITORY)
    private readonly resenaRepo: ResenaRepository,
  ) {}

  async execute(cursoId: string) {
    const todas = await this.resenaRepo.findByCursoId(cursoId);
    // Ocultas por reportes no se muestran en el listado público — el
    // estudiante que reportó no tiene por qué seguir viéndola, y el resto
    // tampoco hasta que un admin la revise (ver ResenaController#restaurar).
    const resenas = todas.filter(r => !r.oculta);
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
