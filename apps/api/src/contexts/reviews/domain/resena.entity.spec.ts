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

  describe('moderación por reportes', () => {
    function crear() {
      return Resena.crear('r1', { cursoId: 'c1', estudianteId: 'autor-1', estudianteNombre: 'Ana', calificacion: 3 });
    }

    it('reportar() suma un reporte sin ocultar todavía', () => {
      const resena = crear();
      resena.reportar('u1');
      expect(resena.totalReportes).toBe(1);
      expect(resena.oculta).toBe(false);
    });

    it('se oculta sola al llegar al umbral de reportes', () => {
      const resena = crear();
      resena.reportar('u1');
      resena.reportar('u2');
      resena.reportar('u3');
      expect(resena.totalReportes).toBe(3);
      expect(resena.oculta).toBe(true);
    });

    it('un mismo usuario no puede reportar dos veces', () => {
      const resena = crear();
      resena.reportar('u1');
      expect(() => resena.reportar('u1')).toThrow('Ya reportaste esta reseña');
      expect(resena.totalReportes).toBe(1);
    });

    it('el autor no puede reportar su propia reseña', () => {
      const resena = crear();
      expect(() => resena.reportar('autor-1')).toThrow('No podés reportar tu propia reseña');
    });

    it('restaurar() la vuelve a mostrar y limpia los reportes', () => {
      const resena = crear();
      resena.reportar('u1');
      resena.reportar('u2');
      resena.reportar('u3');
      expect(resena.oculta).toBe(true);
      resena.restaurar();
      expect(resena.oculta).toBe(false);
      expect(resena.totalReportes).toBe(0);
    });
  });
});
