import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../domain/pregunta.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';

export interface EliminarPreguntaCommand {
  preguntaId: string;
  callerId: string;
  callerRol: string;
}

@Injectable()
export class EliminarPreguntaUseCase {
  constructor(
    @Inject(PREGUNTA_REPOSITORY)
    private readonly preguntaRepo: PreguntaRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
  ) {}

  async execute(command: EliminarPreguntaCommand): Promise<void> {
    const pregunta = await this.preguntaRepo.findById(command.preguntaId);
    if (!pregunta) throw new NotFoundDomainError('Pregunta no encontrada');

    if (command.callerRol === 'admin' || pregunta.autorId === command.callerId) {
      await this.preguntaRepo.delete(command.preguntaId);
      return;
    }

    // El instructor dueño del curso también puede moderar (borrar) preguntas
    // en sus propias lecciones, aunque no sea el autor.
    const info = await this.cursoRepo.findInfoByLeccionId(pregunta.leccionId);
    if (info?.instructorId === command.callerId) {
      await this.preguntaRepo.delete(command.preguntaId);
      return;
    }

    throw new UnauthorizedDomainError('No tenés permiso para eliminar esta pregunta');
  }
}
