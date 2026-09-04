import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { Pregunta } from '../domain/pregunta.entity';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../domain/pregunta.repository.port';
import { VerificarAccesoVideoUseCase } from '../../content-delivery/application/verificar-acceso-video.use-case';

export interface ListarPreguntasCommand {
  leccionId: string;
  usuarioId?: string;
  usuarioRol?: string;
}

@Injectable()
export class ListarPreguntasUseCase {
  constructor(
    @Inject(PREGUNTA_REPOSITORY)
    private readonly preguntaRepo: PreguntaRepository,
    private readonly verificarAccesoUC: VerificarAccesoVideoUseCase,
  ) {}

  async execute(command: ListarPreguntasCommand): Promise<Pregunta[]> {
    const { permitido, existe } = await this.verificarAccesoUC.execute({
      leccionId: command.leccionId,
      usuarioId: command.usuarioId,
      usuarioRol: command.usuarioRol,
    });
    if (!existe) throw new NotFoundDomainError('Lección no encontrada');
    if (!permitido) {
      throw new UnauthorizedDomainError('Solo podés ver las preguntas de lecciones a las que tenés acceso');
    }
    return this.preguntaRepo.findByLeccionId(command.leccionId);
  }
}
