import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { CursoRepository, CURSO_REPOSITORY } from '../domain/curso.repository.port';
import { EventBus } from '../../../common/event-bus';

@Injectable()
export class PublicarCursoUseCase {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cursoId: string): Promise<void> {
    const curso = await this.cursoRepo.findById(cursoId);
    if (!curso) {
      throw new NotFoundDomainError('Curso no encontrado');
    }

    curso.publicar();
    await this.cursoRepo.save(curso);

    for (const event of curso.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
