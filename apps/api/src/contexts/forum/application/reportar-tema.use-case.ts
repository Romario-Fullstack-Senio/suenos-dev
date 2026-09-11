import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { TEMA_FORO_REPOSITORY, TemaForoRepository } from '../domain/tema-foro.repository.port';

export interface ReportarTemaCommand {
  temaId: string;
  usuarioId: string;
}

@Injectable()
export class ReportarTemaUseCase {
  constructor(
    @Inject(TEMA_FORO_REPOSITORY)
    private readonly temaRepo: TemaForoRepository,
  ) {}

  async execute(command: ReportarTemaCommand): Promise<{ oculta: boolean }> {
    const tema = await this.temaRepo.findById(command.temaId);
    if (!tema) throw new NotFoundDomainError('Tema no encontrado');
    tema.reportar(command.usuarioId);
    await this.temaRepo.save(tema);
    return { oculta: tema.oculta };
  }
}
