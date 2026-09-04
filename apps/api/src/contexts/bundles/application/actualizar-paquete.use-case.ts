import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { PAQUETE_REPOSITORY, PaqueteRepository } from '../domain/paquete.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';

interface ActualizarPaqueteCommand {
  paqueteId: string;
  titulo: string;
  descripcion: string;
  cursoIds: string[];
  descuentoPorcentaje: number;
}

@Injectable()
export class ActualizarPaqueteUseCase {
  constructor(
    @Inject(PAQUETE_REPOSITORY)
    private readonly paqueteRepo: PaqueteRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
  ) {}

  async execute(command: ActualizarPaqueteCommand): Promise<void> {
    const paquete = await this.paqueteRepo.findById(command.paqueteId);
    if (!paquete) throw new NotFoundDomainError('Paquete no encontrado');
    for (const cursoId of command.cursoIds) {
      const curso = await this.cursoRepository.findById(cursoId);
      if (!curso) throw new NotFoundDomainError(`Curso ${cursoId} no encontrado`);
    }
    paquete.actualizar(command);
    await this.paqueteRepo.save(paquete);
  }
}
