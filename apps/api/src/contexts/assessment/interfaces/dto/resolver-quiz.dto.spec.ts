import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ResolverQuizDto } from './resolver-quiz.dto';

function construir(respuestas: unknown) {
  return plainToInstance(ResolverQuizDto, {
    quizId: 'quiz-1',
    estudianteId: 'est-1',
    respuestas,
  });
}

describe('ResolverQuizDto', () => {
  it('acepta un number[][] válido', async () => {
    const errores = await validate(construir([[0], [1, 2], []]));
    expect(errores).toHaveLength(0);
  });

  // Antes de esta validación, un payload así llegaba hasta
  // Pregunta.verificar() -> new Set(objeto) -> TypeError "object is not
  // iterable" -> 500 en vez de 400.
  it('rechaza un array de objetos (el shape que tiraba 500)', async () => {
    const errores = await validate(construir([{ preguntaId: 'p1', seleccionadas: [1] }]));
    expect(errores).toHaveLength(1);
    expect(errores[0].constraints).toHaveProperty('esMatrizDeEnteros');
  });

  it('rechaza un array plano de números', async () => {
    const errores = await validate(construir([0, 1]));
    expect(errores).toHaveLength(1);
  });

  it('rechaza índices no enteros o negativos', async () => {
    expect(await validate(construir([['a']]))).toHaveLength(1);
    expect(await validate(construir([[-1]]))).toHaveLength(1);
    expect(await validate(construir([[1.5]]))).toHaveLength(1);
  });

  it('rechaza respuestas que no son array', async () => {
    const errores = await validate(construir('todas'));
    expect(errores).toHaveLength(1);
  });
});
