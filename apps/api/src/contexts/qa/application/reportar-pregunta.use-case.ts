import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../domain/pregunta.repository.port';

export interface ReportarPreguntaCommand {
  preguntaId: string;
  usuarioId: string;
}

@Injectable()
export class ReportarPreguntaUseCase {
  constructor(
    @Inject(PREGUNTA_REPOSITORY)
    private readonly preguntaRepo: PreguntaRepository,
  ) {}

  async execute(command: ReportarPreguntaCommand): Promise<{ oculta: boolean }> {
    const pregunta = await this.preguntaRepo.findById(command.preguntaId);
    if (!pregunta) {
      throw new NotFoundDomainError('Pregunta no encontrada');
    }
    pregunta.reportar(command.usuarioId);
    await this.preguntaRepo.save(pregunta);
    return { oculta: pregunta.oculta };
  }
}
