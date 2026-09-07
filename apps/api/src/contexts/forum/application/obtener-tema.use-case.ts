import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { TemaForo } from '../domain/tema-foro.entity';
import { TEMA_FORO_REPOSITORY, TemaForoRepository } from '../domain/tema-foro.repository.port';

@Injectable()
export class ObtenerTemaUseCase {
  constructor(
    @Inject(TEMA_FORO_REPOSITORY)
    private readonly temaRepo: TemaForoRepository,
  ) {}

  async execute(id: string): Promise<TemaForo> {
    const tema = await this.temaRepo.findById(id);
    if (!tema) throw new NotFoundDomainError('Tema no encontrado');
    return tema;
  }
}
