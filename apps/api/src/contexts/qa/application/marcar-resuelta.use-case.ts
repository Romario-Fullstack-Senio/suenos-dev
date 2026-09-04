import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../domain/pregunta.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';

export interface MarcarResueltaCommand {
  preguntaId: string;
  resuelta: boolean;
  callerId: string;
  callerRol: string;
}

@Injectable()
export class MarcarResueltaUseCase {
  constructor(
    @Inject(PREGUNTA_REPOSITORY)
    private readonly preguntaRepo: PreguntaRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
  ) {}

  async execute(command: MarcarResueltaCommand): Promise<void> {
    const pregunta = await this.preguntaRepo.findById(command.preguntaId);
    if (!pregunta) throw new NotFoundDomainError('Pregunta no encontrada');

    const info = await this.cursoRepo.findInfoByLeccionId(pregunta.leccionId);
    const esInstructorDueno = info?.instructorId === command.callerId;
    if (command.callerRol !== 'admin' && !esInstructorDueno) {
      throw new UnauthorizedDomainError('Solo el instructor del curso puede marcar una pregunta como resuelta');
    }

    pregunta.marcarResuelta(command.resuelta);
    await this.preguntaRepo.save(pregunta);
  }
}
