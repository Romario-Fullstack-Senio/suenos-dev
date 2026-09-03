import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { RESENA_REPOSITORY, ResenaRepository } from '../domain/resena.repository.port';

export interface EliminarResenaCommand {
  resenaId: string;
  callerId: string;
  callerRol: string;
}

@Injectable()
export class EliminarResenaUseCase {
  constructor(
    @Inject(RESENA_REPOSITORY)
    private readonly resenaRepo: ResenaRepository,
  ) {}

  async execute(command: EliminarResenaCommand): Promise<void> {
    const resena = await this.resenaRepo.findById(command.resenaId);
    if (!resena) {
      throw new NotFoundDomainError('Reseña no encontrada');
    }
    if (command.callerRol !== 'admin' && resena.estudianteId !== command.callerId) {
      throw new UnauthorizedDomainError('No tenés permiso para eliminar esta reseña');
    }
    await this.resenaRepo.delete(command.resenaId);
  }
}
