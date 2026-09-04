import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { PAQUETE_REPOSITORY, PaqueteRepository } from '../domain/paquete.repository.port';

@Injectable()
export class CambiarEstadoPaqueteUseCase {
  constructor(
    @Inject(PAQUETE_REPOSITORY)
    private readonly paqueteRepo: PaqueteRepository,
  ) {}

  async execute(paqueteId: string, activo: boolean): Promise<void> {
    const paquete = await this.paqueteRepo.findById(paqueteId);
    if (!paquete) throw new NotFoundDomainError('Paquete no encontrado');
    paquete.cambiarEstado(activo);
    await this.paqueteRepo.save(paquete);
  }
}
