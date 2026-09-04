import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { Pregunta } from '../domain/pregunta.entity';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../domain/pregunta.repository.port';
import { PreguntaCreada } from '../domain/events/pregunta-creada.event';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { VerificarAccesoVideoUseCase } from '../../content-delivery/application/verificar-acceso-video.use-case';
import { EventBus } from '../../../common/event-bus';

export interface CrearPreguntaCommand {
  leccionId: string;
  autorId: string;
  autorRol: string;
  texto: string;
}

@Injectable()
export class CrearPreguntaUseCase {
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

  async execute(command: CrearPreguntaCommand): Promise<{ id: string }> {
    const { permitido, existe } = await this.verificarAccesoUC.execute({
      leccionId: command.leccionId,
      usuarioId: command.autorId,
      usuarioRol: command.autorRol,
    });
    if (!existe) throw new NotFoundDomainError('Lección no encontrada');
    if (!permitido) {
      throw new UnauthorizedDomainError('Solo podés preguntar sobre lecciones a las que tenés acceso');
    }

    const info = await this.cursoRepo.findInfoByLeccionId(command.leccionId);
    if (!info) throw new NotFoundDomainError('Lección no encontrada');

    const curso = await this.cursoRepo.findById(info.cursoId);
    if (!curso) throw new NotFoundDomainError('Curso no encontrado');
    const leccion = curso.modulos.flatMap(m => m.lecciones).find(l => l.id === command.leccionId);

    const autor = await this.usuarioRepo.findById(command.autorId);
    if (!autor) throw new NotFoundDomainError('Usuario no encontrado');

    const autorEsInstructor = command.autorRol === 'admin' || command.autorId === info.instructorId;

    const id = uuid();
    const pregunta = Pregunta.crear(id, {
      cursoId: info.cursoId,
      leccionId: command.leccionId,
      autorId: command.autorId,
      autorNombre: autor.nombre,
      autorEsInstructor,
      texto: command.texto,
    });
    await this.preguntaRepo.save(pregunta);

    // El instructor no se notifica a sí mismo si pregunta sobre su propio curso.
    if (!autorEsInstructor) {
      await this.eventBus.publish(
        new PreguntaCreada(
          id,
          info.cursoId,
          command.leccionId,
          leccion?.titulo ?? curso.titulo,
          curso.titulo,
          info.instructorId,
          command.autorId,
          autor.nombre,
          pregunta.texto,
        ),
      );
    }

    return { id };
  }
}
