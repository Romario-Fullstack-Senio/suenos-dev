import { Quiz } from './quiz.entity';
import { Pregunta } from './pregunta.entity';

function crearQuizConDosPreguntas(puntajeMinimo: number): Quiz {
  const quiz = Quiz.crear('quiz-1', 'Quiz de prueba', 'curso-1', puntajeMinimo);
  quiz.agregarPregunta(Pregunta.crear('p1', '¿2+2?', ['3', '4', '5'], 'opcion_unica', [1]));
  quiz.agregarPregunta(Pregunta.crear('p2', '¿Capital de Francia?', ['Madrid', 'París'], 'opcion_unica', [1]));
  return quiz;
}

describe('Quiz.resolver', () => {
  it('aprueba cuando el puntaje alcanza el mínimo', () => {
    const quiz = crearQuizConDosPreguntas(50);
    // ambas respuestas correctas -> 100%
    expect(quiz.resolver([[1], [1]])).toBe(true);
  });

  it('reprueba cuando el puntaje queda por debajo del mínimo', () => {
    const quiz = crearQuizConDosPreguntas(80);
    // 1 de 2 correctas -> 50%, por debajo de 80
    expect(quiz.resolver([[1], [0]])).toBe(false);
  });

  it('el puntaje mínimo es inclusive (aprueba si empata exacto)', () => {
    const quiz = crearQuizConDosPreguntas(50);
    // 1 de 2 correctas -> exactamente 50%
    expect(quiz.resolver([[1], [0]])).toBe(true);
  });

  it('un quiz sin preguntas con puntaje mínimo positivo nunca aprueba (evita división por cero)', () => {
    const quiz = Quiz.crear('quiz-vacio', 'Vacío', 'curso-1', 50);
    expect(quiz.resolver([])).toBe(false);
  });

  it('es una operación pura: no muta el quiz ni agrega eventos de dominio', () => {
    const quiz = crearQuizConDosPreguntas(50);
    quiz.resolver([[1], [1]]);
    // Antes, Quiz.resolver() agregaba un evento de dominio malformado
    // ({eventName, occurredOn, aggregateId} sin estudianteId/cursoId/nombres)
    // que dejaba el certificado automático con datos vacíos. Ahora quien
    // construye y publica el evento correcto es ResolverQuizUseCase.
    expect(quiz.pullDomainEvents()).toHaveLength(0);
  });
});

describe('Pregunta', () => {
  it('opción única/verdadero-falso exigen exactamente una respuesta correcta', () => {
    expect(() => Pregunta.crear('p1', '¿?', ['A', 'B'], 'opcion_unica', [0, 1])).toThrow('una única respuesta correcta');
  });

  it('verdadero/falso exige exactamente 2 opciones', () => {
    expect(() => Pregunta.crear('p1', '¿?', ['A', 'B', 'C'], 'verdadero_falso', [0])).toThrow('exactamente 2 opciones');
  });

  it('selección múltiple acepta más de una respuesta correcta', () => {
    const pregunta = Pregunta.crear('p1', '¿Cuáles son primos?', ['2', '3', '4'], 'seleccion_multiple', [0, 1]);
    expect(pregunta.verificar([1, 0])).toBe(true); // orden no importa
    expect(pregunta.verificar([0])).toBe(false); // incompleta
    expect(pregunta.verificar([0, 1, 2])).toBe(false); // de más
  });

  it('rechaza índices de respuesta correcta fuera de rango', () => {
    expect(() => Pregunta.crear('p1', '¿?', ['A', 'B'], 'opcion_unica', [5])).toThrow('índice válido');
  });
});
