import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { RESENA_REPOSITORY, ResenaRepository } from '../domain/resena.repository.port';

@Injectable()
export class RestaurarResenaUseCase {
  constructor(
    @Inject(RESENA_REPOSITORY)
    private readonly resenaRepo: ResenaRepository,
  ) {}

  async execute(resenaId: string): Promise<void> {
    const resena = await this.resenaRepo.findById(resenaId);
    if (!resena) {
      throw new NotFoundDomainError('Reseña no encontrada');
    }
    resena.restaurar();
    await this.resenaRepo.save(resena);
  }
}
