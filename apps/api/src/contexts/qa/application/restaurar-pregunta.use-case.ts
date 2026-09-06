import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../domain/pregunta.repository.port';

@Injectable()
export class RestaurarPreguntaUseCase {
  constructor(
    @Inject(PREGUNTA_REPOSITORY)
    private readonly preguntaRepo: PreguntaRepository,
  ) {}

  async execute(preguntaId: string): Promise<void> {
    const pregunta = await this.preguntaRepo.findById(preguntaId);
    if (!pregunta) {
      throw new NotFoundDomainError('Pregunta no encontrada');
    }
    pregunta.restaurar();
    await this.preguntaRepo.save(pregunta);
  }
}
