import { Inject, Injectable } from '@nestjs/common';
import { Pregunta } from '../domain/pregunta.entity';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../domain/pregunta.repository.port';

/** Panel de moderación del admin — solo las preguntas con al menos un
 * reporte, no todo el Q&A de la plataforma. */
@Injectable()
export class ListarPreguntasReportadasUseCase {
  constructor(
    @Inject(PREGUNTA_REPOSITORY)
    private readonly preguntaRepo: PreguntaRepository,
  ) {}

  async execute(): Promise<Pregunta[]> {
    const todas = await this.preguntaRepo.findAll();
    return todas.filter((p) => p.totalReportes > 0);
  }
}
