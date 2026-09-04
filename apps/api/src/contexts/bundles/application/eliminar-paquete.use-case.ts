import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { PAQUETE_REPOSITORY, PaqueteRepository } from '../domain/paquete.repository.port';

@Injectable()
export class EliminarPaqueteUseCase {
  constructor(
    @Inject(PAQUETE_REPOSITORY)
    private readonly paqueteRepo: PaqueteRepository,
  ) {}

  async execute(paqueteId: string): Promise<void> {
    const paquete = await this.paqueteRepo.findById(paqueteId);
    if (!paquete) throw new NotFoundDomainError('Paquete no encontrado');
    await this.paqueteRepo.delete(paqueteId);
  }
}
