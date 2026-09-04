import { Pregunta } from './pregunta.entity';
import { Respuesta } from './respuesta.entity';

function crearPregunta() {
  return Pregunta.crear('p1', {
    cursoId: 'curso-1',
    leccionId: 'leccion-1',
    autorId: 'alumno-1',
    autorNombre: 'Ana',
    autorEsInstructor: false,
    texto: '¿Cómo configuro el entorno?',
  });
}

describe('Pregunta', () => {
  it('crea una pregunta válida sin respuestas y no resuelta', () => {
    const pregunta = crearPregunta();
    expect(pregunta.texto).toBe('¿Cómo configuro el entorno?');
    expect(pregunta.resuelta).toBe(false);
    expect(pregunta.respuestas).toHaveLength(0);
  });

  it('rechaza texto vacío', () => {
    expect(() =>
      Pregunta.crear('p1', {
        cursoId: 'c1', leccionId: 'l1', autorId: 'a1', autorNombre: 'Ana', autorEsInstructor: false, texto: '   ',
      }),
    ).toThrow('no puede estar vacía');
  });

  it('rechaza texto demasiado largo', () => {
    expect(() =>
      Pregunta.crear('p1', {
        cursoId: 'c1', leccionId: 'l1', autorId: 'a1', autorNombre: 'Ana', autorEsInstructor: false, texto: 'a'.repeat(2001),
      }),
    ).toThrow('demasiado larga');
  });

  it('agregarRespuesta() de un alumno no marca la pregunta como resuelta', () => {
    const pregunta = crearPregunta();
    const respuesta = Respuesta.crear('r1', { autorId: 'alumno-2', autorNombre: 'Beto', autorEsInstructor: false, texto: 'A mí también me pasó' });
    pregunta.agregarRespuesta(respuesta);
    expect(pregunta.respuestas).toHaveLength(1);
    expect(pregunta.resuelta).toBe(false);
  });

  it('agregarRespuesta() del instructor marca la pregunta como resuelta automáticamente', () => {
    const pregunta = crearPregunta();
    const respuesta = Respuesta.crear('r1', { autorId: 'instructor-1', autorNombre: 'Profe', autorEsInstructor: true, texto: 'Seguí estos pasos...' });
    pregunta.agregarRespuesta(respuesta);
    expect(pregunta.resuelta).toBe(true);
  });

  it('marcarResuelta() cambia el estado manualmente', () => {
    const pregunta = crearPregunta();
    pregunta.marcarResuelta(true);
    expect(pregunta.resuelta).toBe(true);
    pregunta.marcarResuelta(false);
    expect(pregunta.resuelta).toBe(false);
  });
});

describe('Respuesta', () => {
  it('rechaza texto vacío', () => {
    expect(() =>
      Respuesta.crear('r1', { autorId: 'a1', autorNombre: 'Ana', autorEsInstructor: false, texto: '' }),
    ).toThrow('no puede estar vacía');
  });

  it('rechaza texto demasiado largo', () => {
    expect(() =>
      Respuesta.crear('r1', { autorId: 'a1', autorNombre: 'Ana', autorEsInstructor: false, texto: 'a'.repeat(3001) }),
    ).toThrow('demasiado larga');
  });
});
