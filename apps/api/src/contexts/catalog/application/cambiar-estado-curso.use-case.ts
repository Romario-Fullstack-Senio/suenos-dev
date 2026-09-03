import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { CursoRepository, CURSO_REPOSITORY } from '../domain/curso.repository.port';
import { EventBus } from '../../../common/event-bus';

interface CambiarEstadoCursoCommand {
  cursoId: string;
  callerId: string;
  callerRol: string;
  estado: 'borrador' | 'publicado';
}

@Injectable()
export class CambiarEstadoCursoUseCase {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CambiarEstadoCursoCommand): Promise<void> {
    const curso = await this.cursoRepo.findById(command.cursoId);
    if (!curso) {
      throw new NotFoundDomainError('Curso no encontrado');
    }
    if (command.callerRol !== 'admin' && curso.instructorId !== command.callerId) {
      throw new UnauthorizedDomainError('No tienes permiso para modificar este curso');
    }

    if (command.estado === 'publicado') {
      curso.publicar();
    } else if (command.estado === 'borrador') {
      curso.despublicar();
    } else {
      throw new DomainError(`Estado inválido: ${command.estado}`);
    }

    await this.cursoRepo.save(curso);

    for (const event of curso.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
