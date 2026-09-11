import { Inject, Injectable } from '@nestjs/common';
import { TemaForo, CategoriaForo } from '../domain/tema-foro.entity';
import { TEMA_FORO_REPOSITORY, TemaForoRepository } from '../domain/tema-foro.repository.port';

@Injectable()
export class ListarTemasUseCase {
  constructor(
    @Inject(TEMA_FORO_REPOSITORY)
    private readonly temaRepo: TemaForoRepository,
  ) {}

  async execute(categoria?: CategoriaForo): Promise<TemaForo[]> {
    return this.temaRepo.findVisibles(categoria);
  }
}
