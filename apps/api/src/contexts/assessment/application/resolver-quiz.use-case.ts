import { Inject, Injectable } from '@nestjs/common';
import { Quiz } from '../domain/quiz.entity';
import { Intento } from '../domain/intento.entity';
import { QuizRepository, QUIZ_REPOSITORY } from '../domain/quiz.repository.port';
import { EventBus } from '../../../common/event-bus';
import { v4 as uuidv4 } from 'uuid';

export interface ResolverQuizCommand {
  quizId: string;
  estudianteId: string;
  respuestas: number[];
}

@Injectable()
export class ResolverQuizUseCase {
  constructor(
    @Inject(QUIZ_REPOSITORY)
    private readonly quizRepository: QuizRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ResolverQuizCommand): Promise<{ intento: Intento; aprobado: boolean }> {
    const quiz = await this.quizRepository.findById(command.quizId);
    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    const intentoId = uuidv4();
    const intento = Intento.crear(intentoId, command.estudianteId, command.quizId);
    intento.setRespuestas(command.respuestas);

    const aprobado = quiz.resolver(intentoId, command.estudianteId, command.respuestas);
    
    let respuestasCorrectas = 0;
    const preguntas = quiz.preguntas;
    for (let i = 0; i < preguntas.length; i++) {
      if (preguntas[i].verificar(command.respuestas[i])) {
        respuestasCorrectas++;
      }
    }
    const totalPreguntas = preguntas.length;
    const puntaje = totalPreguntas > 0 ? (respuestasCorrectas / totalPreguntas) * 100 : 0;

    intento.setPuntaje(puntaje);
    intento.setAprobado(aprobado);

    const domainEvents = quiz.pullDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }

    return { intento, aprobado };
  }
}
