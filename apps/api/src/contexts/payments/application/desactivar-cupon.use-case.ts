import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { CUPON_REPOSITORY, CuponRepository } from '../domain/cupon.repository.port';

@Injectable()
export class DesactivarCuponUseCase {
  constructor(
    @Inject(CUPON_REPOSITORY)
    private readonly cuponRepo: CuponRepository,
  ) {}

  async execute(cuponId: string, callerRol: string): Promise<void> {
    if (callerRol !== 'admin') {
      throw new UnauthorizedDomainError('Solo un administrador puede desactivar cupones');
    }
    const cupon = await this.cuponRepo.findById(cuponId);
    if (!cupon) {
      throw new NotFoundDomainError('Cupón no encontrado');
    }
    cupon.desactivar();
    await this.cuponRepo.save(cupon);
  }
}
