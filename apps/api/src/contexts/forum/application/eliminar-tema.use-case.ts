import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { TEMA_FORO_REPOSITORY, TemaForoRepository } from '../domain/tema-foro.repository.port';

interface EliminarTemaCommand {
  temaId: string;
  callerId: string;
  callerEsAdmin: boolean;
}

@Injectable()
export class EliminarTemaUseCase {
  constructor(
    @Inject(TEMA_FORO_REPOSITORY)
    private readonly temaRepo: TemaForoRepository,
  ) {}

  async execute(command: EliminarTemaCommand): Promise<void> {
    const tema = await this.temaRepo.findById(command.temaId);
    if (!tema) throw new NotFoundDomainError('Tema no encontrado');
    tema.verificarPuedeEliminar(command.callerId, command.callerEsAdmin);
    await this.temaRepo.delete(command.temaId);
  }
}
