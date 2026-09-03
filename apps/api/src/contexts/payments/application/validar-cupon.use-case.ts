import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { CUPON_REPOSITORY, CuponRepository } from '../domain/cupon.repository.port';

export interface ValidarCuponCommand {
  codigo: string;
  cursoId: string;
  precio: number;
}

export interface ValidarCuponResultado {
  codigo: string;
  descuento: number;
  precioFinal: number;
}

/** Solo valida y calcula el descuento — NO registra el uso. El uso se
 * registra recién cuando la orden se crea de verdad (ver CrearOrdenUseCase),
 * para no "gastar" un cupón de un solo uso en una simple previsualización. */
@Injectable()
export class ValidarCuponUseCase {
  constructor(
    @Inject(CUPON_REPOSITORY)
    private readonly cuponRepo: CuponRepository,
  ) {}

  async execute(command: ValidarCuponCommand): Promise<ValidarCuponResultado> {
    const cupon = await this.cuponRepo.findByCodigo(command.codigo);
    if (!cupon) {
      throw new NotFoundDomainError('Cupón no encontrado');
    }

    const resultado = cupon.esValidoPara(command.cursoId);
    if (!resultado.valido) {
      throw new DomainError(resultado.motivo ?? 'Cupón no válido');
    }

    const descuento = cupon.calcularDescuento(command.precio);
    return {
      codigo: cupon.codigo,
      descuento,
      precioFinal: Math.max(command.precio - descuento, 0),
    };
  }
}
