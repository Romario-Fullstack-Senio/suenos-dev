import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { RESENA_REPOSITORY, ResenaRepository } from '../domain/resena.repository.port';

export interface ReportarResenaCommand {
  resenaId: string;
  usuarioId: string;
}

@Injectable()
export class ReportarResenaUseCase {
  constructor(
    @Inject(RESENA_REPOSITORY)
    private readonly resenaRepo: ResenaRepository,
  ) {}

  async execute(command: ReportarResenaCommand): Promise<{ oculta: boolean }> {
    const resena = await this.resenaRepo.findById(command.resenaId);
    if (!resena) {
      throw new NotFoundDomainError('Reseña no encontrada');
    }
    resena.reportar(command.usuarioId);
    await this.resenaRepo.save(resena);
    return { oculta: resena.oculta };
  }
}
