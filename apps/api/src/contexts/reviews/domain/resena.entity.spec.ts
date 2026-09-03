import { Resena } from './resena.entity';

describe('Resena', () => {
  it('crea una reseña válida', () => {
    const resena = Resena.crear('r1', {
      cursoId: 'curso-1',
      estudianteId: 'estudiante-1',
      estudianteNombre: 'Ana',
      calificacion: 5,
      comentario: 'Excelente curso',
    });
    expect(resena.calificacion).toBe(5);
    expect(resena.comentario).toBe('Excelente curso');
  });

  it('rechaza calificaciones fuera de 1-5', () => {
    expect(() =>
      Resena.crear('r1', { cursoId: 'c1', estudianteId: 'e1', estudianteNombre: 'Ana', calificacion: 0 }),
    ).toThrow('debe ser un número entero entre 1 y 5');
    expect(() =>
      Resena.crear('r1', { cursoId: 'c1', estudianteId: 'e1', estudianteNombre: 'Ana', calificacion: 6 }),
    ).toThrow('debe ser un número entero entre 1 y 5');
  });

  it('rechaza calificaciones no enteras', () => {
    expect(() =>
      Resena.crear('r1', { cursoId: 'c1', estudianteId: 'e1', estudianteNombre: 'Ana', calificacion: 3.5 }),
    ).toThrow('debe ser un número entero entre 1 y 5');
  });

  it('comentario vacío se guarda como null', () => {
    const resena = Resena.crear('r1', { cursoId: 'c1', estudianteId: 'e1', estudianteNombre: 'Ana', calificacion: 4, comentario: '   ' });
    expect(resena.comentario).toBeNull();
  });

  it('editar() actualiza calificación y comentario', () => {
    const resena = Resena.crear('r1', { cursoId: 'c1', estudianteId: 'e1', estudianteNombre: 'Ana', calificacion: 3 });
    resena.editar(5, 'Ahora me encantó');
    expect(resena.calificacion).toBe(5);
    expect(resena.comentario).toBe('Ahora me encantó');
  });
});
