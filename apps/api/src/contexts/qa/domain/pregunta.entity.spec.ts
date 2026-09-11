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

  describe('moderación por reportes', () => {
    it('se oculta sola al llegar al umbral de reportes', () => {
      const pregunta = crearPregunta();
      pregunta.reportar('u1');
      pregunta.reportar('u2');
      expect(pregunta.oculta).toBe(false);
      pregunta.reportar('u3');
      expect(pregunta.totalReportes).toBe(3);
      expect(pregunta.oculta).toBe(true);
    });

    it('un mismo usuario no puede reportar dos veces', () => {
      const pregunta = crearPregunta();
      pregunta.reportar('u1');
      expect(() => pregunta.reportar('u1')).toThrow('Ya reportaste esta pregunta');
    });

    it('el autor no puede reportar su propia pregunta', () => {
      const pregunta = crearPregunta();
      expect(() => pregunta.reportar('alumno-1')).toThrow('No podés reportar tu propia pregunta');
    });

    it('restaurar() la vuelve a mostrar y limpia los reportes', () => {
      const pregunta = crearPregunta();
      pregunta.reportar('u1');
      pregunta.reportar('u2');
      pregunta.reportar('u3');
      pregunta.restaurar();
      expect(pregunta.oculta).toBe(false);
      expect(pregunta.totalReportes).toBe(0);
    });
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
