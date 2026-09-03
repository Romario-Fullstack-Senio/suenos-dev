import { Quiz } from './quiz.entity';
import { Pregunta } from './pregunta.entity';

function crearQuizConDosPreguntas(puntajeMinimo: number): Quiz {
  const quiz = Quiz.crear('quiz-1', 'Quiz de prueba', 'curso-1', puntajeMinimo);
  quiz.agregarPregunta(Pregunta.crear('p1', '¿2+2?', ['3', '4', '5'], 1));
  quiz.agregarPregunta(Pregunta.crear('p2', '¿Capital de Francia?', ['Madrid', 'París'], 1));
  return quiz;
}

describe('Quiz.resolver', () => {
  it('aprueba cuando el puntaje alcanza el mínimo', () => {
    const quiz = crearQuizConDosPreguntas(50);
    // ambas respuestas correctas -> 100%
    expect(quiz.resolver([1, 1])).toBe(true);
  });

  it('reprueba cuando el puntaje queda por debajo del mínimo', () => {
    const quiz = crearQuizConDosPreguntas(80);
    // 1 de 2 correctas -> 50%, por debajo de 80
    expect(quiz.resolver([1, 0])).toBe(false);
  });

  it('el puntaje mínimo es inclusive (aprueba si empata exacto)', () => {
    const quiz = crearQuizConDosPreguntas(50);
    // 1 de 2 correctas -> exactamente 50%
    expect(quiz.resolver([1, 0])).toBe(true);
  });

  it('un quiz sin preguntas con puntaje mínimo positivo nunca aprueba (evita división por cero)', () => {
    const quiz = Quiz.crear('quiz-vacio', 'Vacío', 'curso-1', 50);
    expect(quiz.resolver([])).toBe(false);
  });

  it('es una operación pura: no muta el quiz ni agrega eventos de dominio', () => {
    const quiz = crearQuizConDosPreguntas(50);
    quiz.resolver([1, 1]);
    // Antes, Quiz.resolver() agregaba un evento de dominio malformado
    // ({eventName, occurredOn, aggregateId} sin estudianteId/cursoId/nombres)
    // que dejaba el certificado automático con datos vacíos. Ahora quien
    // construye y publica el evento correcto es ResolverQuizUseCase.
    expect(quiz.pullDomainEvents()).toHaveLength(0);
  });
});
