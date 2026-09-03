import { ResolverQuizUseCase } from './resolver-quiz.use-case';
import { Quiz } from '../domain/quiz.entity';
import { Pregunta } from '../domain/pregunta.entity';
import { QuizAprobadoEvent } from '../domain/events/quiz-aprobado.event';

function crearQuiz(puntajeMinimo: number): Quiz {
  const quiz = Quiz.crear('quiz-1', 'Quiz de prueba', 'curso-1', puntajeMinimo);
  quiz.agregarPregunta(Pregunta.crear('p1', '¿2+2?', ['3', '4'], 1));
  return quiz;
}

describe('ResolverQuizUseCase', () => {
  let useCase: ResolverQuizUseCase;
  let mockQuizRepo: { findById: jest.Mock };
  let mockIntentoRepo: { save: jest.Mock };
  let mockUsuarioRepo: { findById: jest.Mock };
  let mockCursoRepo: { findById: jest.Mock };
  let mockEventBus: { publish: jest.Mock };

  beforeEach(() => {
    mockQuizRepo = { findById: jest.fn() };
    mockIntentoRepo = { save: jest.fn().mockResolvedValue(undefined) };
    mockUsuarioRepo = { findById: jest.fn() };
    mockCursoRepo = { findById: jest.fn() };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    useCase = new ResolverQuizUseCase(
      mockQuizRepo as any,
      mockIntentoRepo as any,
      mockUsuarioRepo as any,
      mockCursoRepo as any,
      mockEventBus as any,
    );
  });

  it('guarda el intento en el repositorio (antes nunca se persistía)', async () => {
    mockQuizRepo.findById.mockResolvedValue(crearQuiz(100));

    await useCase.execute({ quizId: 'quiz-1', estudianteId: 'est-1', respuestas: [1] });

    expect(mockIntentoRepo.save).toHaveBeenCalledTimes(1);
    const intentoGuardado = mockIntentoRepo.save.mock.calls[0][0];
    expect(intentoGuardado.estudianteId).toBe('est-1');
    expect(intentoGuardado.quizId).toBe('quiz-1');
  });

  it('cuando aprueba, publica QuizAprobadoEvent con estudianteId, cursoId y nombres reales', async () => {
    mockQuizRepo.findById.mockResolvedValue(crearQuiz(50));
    mockUsuarioRepo.findById.mockResolvedValue({ nombre: 'María Fernández' });
    mockCursoRepo.findById.mockResolvedValue({ titulo: 'Curso de NestJS' });

    await useCase.execute({ quizId: 'quiz-1', estudianteId: 'est-1', respuestas: [1] });

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const evento = mockEventBus.publish.mock.calls[0][0];
    expect(evento).toBeInstanceOf(QuizAprobadoEvent);
    expect(evento.eventName).toBe('QuizAprobado'); // requerido para que @OnEvent('QuizAprobado') lo capture
    expect(evento.estudianteId).toBe('est-1');
    expect(evento.cursoId).toBe('curso-1');
    expect(evento.estudianteNombre).toBe('María Fernández');
    expect(evento.cursoNombre).toBe('Curso de NestJS');
  });

  it('cuando reprueba, NO publica ningún evento', async () => {
    mockQuizRepo.findById.mockResolvedValue(crearQuiz(100));

    const { aprobado } = await useCase.execute({ quizId: 'quiz-1', estudianteId: 'est-1', respuestas: [0] });

    expect(aprobado).toBe(false);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('lanza NotFoundDomainError si el quiz no existe', async () => {
    mockQuizRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ quizId: 'no-existe', estudianteId: 'est-1', respuestas: [] }),
    ).rejects.toThrow('Quiz no encontrado');
  });
});
