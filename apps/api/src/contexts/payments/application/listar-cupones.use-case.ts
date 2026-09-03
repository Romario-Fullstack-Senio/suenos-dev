import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { CUPON_REPOSITORY, CuponRepository } from '../domain/cupon.repository.port';

@Injectable()
export class ListarCuponesUseCase {
  constructor(
    @Inject(CUPON_REPOSITORY)
    private readonly cuponRepo: CuponRepository,
  ) {}

  async execute(callerRol: string) {
    if (callerRol !== 'admin') {
      throw new UnauthorizedDomainError('Solo un administrador puede ver los cupones');
    }
    const cupones = await this.cuponRepo.findAll();
    return cupones.map(c => ({
      id: c.id,
      codigo: c.codigo,
      tipo: c.tipo,
      valor: c.valor,
      activo: c.activo,
      cursoId: c.cursoId,
      fechaExpiracion: c.fechaExpiracion,
      usosMaximos: c.usosMaximos,
      usosActuales: c.usosActuales,
    }));
  }
}
