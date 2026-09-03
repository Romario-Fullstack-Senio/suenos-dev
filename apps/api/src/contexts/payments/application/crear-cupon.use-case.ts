import { Inject, Injectable } from '@nestjs/common';
import { ConflictDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { Cupon, TipoCupon } from '../domain/cupon.entity';
import { CUPON_REPOSITORY, CuponRepository } from '../domain/cupon.repository.port';
import { v4 as uuid } from 'uuid';

export interface CrearCuponCommand {
  callerRol: string;
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  cursoId?: string;
  fechaExpiracion?: string;
  usosMaximos?: number;
}

@Injectable()
export class CrearCuponUseCase {
  constructor(
    @Inject(CUPON_REPOSITORY)
    private readonly cuponRepo: CuponRepository,
  ) {}

  async execute(command: CrearCuponCommand): Promise<{ id: string; codigo: string }> {
    if (command.callerRol !== 'admin') {
      throw new UnauthorizedDomainError('Solo un administrador puede crear cupones');
    }

    const existente = await this.cuponRepo.findByCodigo(command.codigo);
    if (existente) {
      throw new ConflictDomainError(`Ya existe un cupón con el código "${command.codigo.trim().toUpperCase()}"`);
    }

    const id = uuid();
    const cupon = Cupon.crear(id, {
      codigo: command.codigo,
      tipo: command.tipo,
      valor: command.valor,
      cursoId: command.cursoId,
      fechaExpiracion: command.fechaExpiracion ? new Date(command.fechaExpiracion) : undefined,
      usosMaximos: command.usosMaximos,
    });
    await this.cuponRepo.save(cupon);
    return { id, codigo: cupon.codigo };
  }
}
