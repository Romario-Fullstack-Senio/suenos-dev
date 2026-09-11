import { Inject, Injectable } from '@nestjs/common';
import { TemaForo } from '../domain/tema-foro.entity';
import { TEMA_FORO_REPOSITORY, TemaForoRepository } from '../domain/tema-foro.repository.port';

/** Panel de moderación del admin — solo temas con al menos un reporte,
 * mismo criterio que ListarPreguntasReportadasUseCase (Q&A). */
@Injectable()
export class ListarTemasReportadosUseCase {
  constructor(
    @Inject(TEMA_FORO_REPOSITORY)
    private readonly temaRepo: TemaForoRepository,
  ) {}

  async execute(): Promise<TemaForo[]> {
    const todos = await this.temaRepo.findAll();
    return todos.filter((t) => t.totalReportes > 0);
  }
}
