import { Inject, Injectable } from '@nestjs/common';
import { Quiz } from '../domain/quiz.entity';
import { Pregunta } from '../domain/pregunta.entity';
import { QuizRepository, QUIZ_REPOSITORY } from '../domain/quiz.repository.port';
import { v4 as uuidv4 } from 'uuid';

export interface CrearQuizCommand {
  titulo: string;
  cursoId: string;
  puntajeMinimo: number;
  preguntas: {
    enunciado: string;
    opciones: string[];
    respuestaCorrecta: number;
  }[];
}

@Injectable()
export class CrearQuizUseCase {
  constructor(
    @Inject(QUIZ_REPOSITORY)
    private readonly quizRepository: QuizRepository,
  ) {}

  async execute(command: CrearQuizCommand): Promise<Quiz> {
    const quizId = uuidv4();
    const quiz = Quiz.crear(quizId, command.titulo, command.cursoId, command.puntajeMinimo);

    for (const preguntaData of command.preguntas) {
      const preguntaId = uuidv4();
      const pregunta = Pregunta.crear(
        preguntaId,
        preguntaData.enunciado,
        preguntaData.opciones,
        preguntaData.respuestaCorrecta,
      );
      quiz.agregarPregunta(pregunta);
    }

    await this.quizRepository.save(quiz);
    return quiz;
  }
}
