import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { Respuesta } from '../domain/respuesta.entity';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../domain/pregunta.repository.port';
import { RespuestaCreada } from '../domain/events/respuesta-creada.event';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { VerificarAccesoVideoUseCase } from '../../content-delivery/application/verificar-acceso-video.use-case';
import { EventBus } from '../../../common/event-bus';

export interface ResponderPreguntaCommand {
  preguntaId: string;
  autorId: string;
  autorRol: string;
  texto: string;
}

@Injectable()
export class ResponderPreguntaUseCase {
  constructor(
    @Inject(PREGUNTA_REPOSITORY)
    private readonly preguntaRepo: PreguntaRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly verificarAccesoUC: VerificarAccesoVideoUseCase,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ResponderPreguntaCommand): Promise<{ id: string }> {
    const pregunta = await this.preguntaRepo.findById(command.preguntaId);
    if (!pregunta) throw new NotFoundDomainError('Pregunta no encontrada');

    const { permitido } = await this.verificarAccesoUC.execute({
      leccionId: pregunta.leccionId,
      usuarioId: command.autorId,
      usuarioRol: command.autorRol,
    });
    if (!permitido) {
      throw new UnauthorizedDomainError('Solo podés responder preguntas de lecciones a las que tenés acceso');
    }

    const info = await this.cursoRepo.findInfoByLeccionId(pregunta.leccionId);
    if (!info) throw new NotFoundDomainError('Lección no encontrada');

    const autor = await this.usuarioRepo.findById(command.autorId);
    if (!autor) throw new NotFoundDomainError('Usuario no encontrado');

    const autorEsInstructor = command.autorRol === 'admin' || command.autorId === info.instructorId;

    const id = uuid();
    const respuesta = Respuesta.crear(id, {
      autorId: command.autorId,
      autorNombre: autor.nombre,
      autorEsInstructor,
      texto: command.texto,
    });
    pregunta.agregarRespuesta(respuesta);
    await this.preguntaRepo.save(pregunta);

    // No te notificás a vos mismo si respondés tu propia pregunta.
    if (pregunta.autorId !== command.autorId) {
      const curso = await this.cursoRepo.findById(info.cursoId);
      const leccion = curso?.modulos.flatMap(m => m.lecciones).find(l => l.id === pregunta.leccionId);

      await this.eventBus.publish(
        new RespuestaCreada(
          id,
          pregunta.id,
          info.cursoId,
          pregunta.leccionId,
          leccion?.titulo ?? curso?.titulo ?? '',
          curso?.titulo ?? '',
          pregunta.autorId,
          command.autorId,
          autor.nombre,
          autorEsInstructor,
          respuesta.texto,
        ),
      );
    }

    return { id };
  }
}
