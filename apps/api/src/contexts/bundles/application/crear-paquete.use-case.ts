import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { Paquete } from '../domain/paquete.entity';
import { PAQUETE_REPOSITORY, PaqueteRepository } from '../domain/paquete.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';

interface CrearPaqueteCommand {
  titulo: string;
  descripcion: string;
  cursoIds: string[];
  descuentoPorcentaje: number;
}

@Injectable()
export class CrearPaqueteUseCase {
  constructor(
    @Inject(PAQUETE_REPOSITORY)
    private readonly paqueteRepo: PaqueteRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
  ) {}

  async execute(command: CrearPaqueteCommand): Promise<Paquete> {
    for (const cursoId of command.cursoIds) {
      const curso = await this.cursoRepository.findById(cursoId);
      if (!curso) throw new NotFoundDomainError(`Curso ${cursoId} no encontrado`);
    }
    const paquete = Paquete.crear(uuid(), command);
    await this.paqueteRepo.save(paquete);
    return paquete;
  }
}
