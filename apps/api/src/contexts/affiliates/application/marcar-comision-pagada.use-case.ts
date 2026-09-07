import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import {
  COMISION_AFILIADO_REPOSITORY,
  ComisionAfiliadoRepository,
} from '../domain/comision-afiliado.repository.port';

@Injectable()
export class MarcarComisionPagadaUseCase {
  constructor(
    @Inject(COMISION_AFILIADO_REPOSITORY)
    private readonly comisionRepo: ComisionAfiliadoRepository,
  ) {}

  async execute(comisionId: string): Promise<void> {
    const comision = await this.comisionRepo.findById(comisionId);
    if (!comision) throw new NotFoundDomainError('Comisión no encontrada');
    comision.marcarPagada();
    await this.comisionRepo.save(comision);
  }
}
