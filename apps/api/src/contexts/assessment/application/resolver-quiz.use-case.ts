import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { Intento } from '../domain/intento.entity';
import { QuizRepository, QUIZ_REPOSITORY } from '../domain/quiz.repository.port';
import { IntentoRepository, INTENTO_REPOSITORY } from '../domain/intento.repository.port';
import { QuizAprobadoEvent } from '../domain/events/quiz-aprobado.event';
import { EventBus } from '../../../common/event-bus';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../../identity/domain/usuario.repository.port';
import { CursoRepository, CURSO_REPOSITORY } from '../../catalog/domain/curso.repository.port';
import { v4 as uuidv4 } from 'uuid';

export interface ResolverQuizCommand {
  quizId: string;
  estudianteId: string;
  // Una entrada por pregunta, cada una con los índices seleccionados —
  // opción única/verdadero-falso mandan un array de 1 elemento, selección
  // múltiple puede mandar varios.
  respuestas: number[][];
}

@Injectable()
export class ResolverQuizUseCase {
  constructor(
    @Inject(QUIZ_REPOSITORY)
    private readonly quizRepository: QuizRepository,
    @Inject(INTENTO_REPOSITORY)
    private readonly intentoRepository: IntentoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ResolverQuizCommand): Promise<{ intento: Intento; aprobado: boolean }> {
    const quiz = await this.quizRepository.findById(command.quizId);
    if (!quiz) {
      throw new NotFoundDomainError('Quiz no encontrado');
    }

    const intentoId = uuidv4();
    const intento = Intento.crear(intentoId, command.estudianteId, command.quizId);
    intento.setRespuestas(command.respuestas);

    const aprobado = quiz.resolver(command.respuestas);

    let respuestasCorrectas = 0;
    const preguntas = quiz.preguntas;
    for (let i = 0; i < preguntas.length; i++) {
      if (preguntas[i].verificar(command.respuestas[i] ?? [])) {
        respuestasCorrectas++;
      }
    }
    const totalPreguntas = preguntas.length;
    const puntaje = totalPreguntas > 0 ? (respuestasCorrectas / totalPreguntas) * 100 : 0;

    intento.setPuntaje(puntaje);
    intento.setAprobado(aprobado);

    // Antes de este fix el intento nunca se guardaba — la tabla `intentos`
    // existía en la base de datos pero ningún repositorio la usaba.
    await this.intentoRepository.save(intento);

    if (aprobado) {
      // Se resuelven los nombres acá (no dentro de Quiz.resolver()) porque el
      // agregado Quiz no tiene por qué conocer otros contextos — ver el
      // comentario en QuizAprobadoEvent.
      const [estudiante, curso] = await Promise.all([
        this.usuarioRepository.findById(command.estudianteId),
        this.cursoRepository.findById(quiz.cursoId),
      ]);
      if (estudiante && curso) {
        await this.eventBus.publish(
          new QuizAprobadoEvent(quiz.id, command.estudianteId, quiz.cursoId, estudiante.nombre, curso.titulo),
        );
      }
    }

    return { intento, aprobado };
  }
}
