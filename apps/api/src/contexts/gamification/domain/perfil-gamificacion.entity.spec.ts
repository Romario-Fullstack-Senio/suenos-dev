import { PerfilGamificacion } from './perfil-gamificacion.entity';

function crear() {
  return PerfilGamificacion.crear('p1', 'usuario-1');
}

describe('PerfilGamificacion', () => {
  it('arranca en cero', () => {
    const perfil = crear();
    expect(perfil.puntos).toBe(0);
    expect(perfil.rachaActual).toBe(0);
    expect(perfil.insigniasObtenidas).toHaveLength(0);
  });

  it('registrarLeccionCompletada() suma puntos y cuenta la lección', () => {
    const perfil = crear();
    perfil.registrarLeccionCompletada();
    expect(perfil.puntos).toBe(10);
    expect(perfil.leccionesCompletadas).toBe(1);
  });

  it('registrarCursoComprado() suma puntos y cuenta el curso', () => {
    const perfil = crear();
    perfil.registrarCursoComprado();
    expect(perfil.puntos).toBe(20);
    expect(perfil.cursosComprados).toBe(1);
  });

  it('registrarQuizAprobado() suma puntos y cuenta el quiz', () => {
    const perfil = crear();
    perfil.registrarQuizAprobado();
    expect(perfil.puntos).toBe(50);
    expect(perfil.quizzesAprobados).toBe(1);
  });

  describe('insignias por hito', () => {
    it('primera_leccion se gana en la primera lección completada, no antes', () => {
      const perfil = crear();
      const nuevas = perfil.registrarLeccionCompletada();
      expect(nuevas).toContain('primera_leccion');
      expect(perfil.insigniasObtenidas).toContain('primera_leccion');
    });

    it('no vuelve a devolver una insignia ya obtenida', () => {
      const perfil = crear();
      perfil.registrarLeccionCompletada();
      const segunda = perfil.registrarLeccionCompletada();
      expect(segunda).not.toContain('primera_leccion');
    });

    it('diez_lecciones se gana recién en la lección número 10', () => {
      const perfil = crear();
      let nuevas: string[] = [];
      for (let i = 0; i < 10; i++) nuevas = perfil.registrarLeccionCompletada();
      expect(perfil.leccionesCompletadas).toBe(10);
      expect(nuevas).toContain('diez_lecciones');
    });

    it('cinco_cursos se gana en la quinta compra', () => {
      const perfil = crear();
      let nuevas: string[] = [];
      for (let i = 0; i < 5; i++) nuevas = perfil.registrarCursoComprado();
      expect(nuevas).toContain('cinco_cursos');
    });

    it('estudiante_dedicado se gana al llegar a 500 puntos', () => {
      const perfil = crear();
      let nuevas: string[] = [];
      // 50 puntos por quiz aprobado — 10 quizzes = 500 puntos.
      for (let i = 0; i < 10; i++) nuevas = perfil.registrarQuizAprobado();
      expect(perfil.puntos).toBe(500);
      expect(nuevas).toContain('estudiante_dedicado');
    });
  });

  describe('racha de actividad', () => {
    it('la primera actividad pone la racha en 1', () => {
      const perfil = crear();
      perfil.registrarLeccionCompletada();
      expect(perfil.rachaActual).toBe(1);
      expect(perfil.rachaMaxima).toBe(1);
    });

    it('dos actividades el mismo día no suman la racha dos veces', () => {
      const perfil = crear();
      perfil.registrarLeccionCompletada();
      perfil.registrarLeccionCompletada();
      expect(perfil.rachaActual).toBe(1);
    });

    it('actividad al día siguiente suma la racha', () => {
      const perfil = crear();
      perfil.registrarLeccionCompletada();
      // Simula que la última actividad fue ayer, escribiendo el prop
      // directo (no hay setter de dominio para "viajar en el tiempo",
      // como corresponde) — mismo patrón que otros specs de este repo
      // (ver progreso-leccion / verificar-acceso-video specs).
      Object.defineProperty(perfil, 'props', {
        value: { ...(perfil as any).props, ultimaActividadFecha: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      perfil.registrarLeccionCompletada();
      expect(perfil.rachaActual).toBe(2);
      expect(perfil.rachaMaxima).toBe(2);
    });

    it('saltarse un día corta la racha', () => {
      const perfil = crear();
      perfil.registrarLeccionCompletada();
      Object.defineProperty(perfil, 'props', {
        value: { ...(perfil as any).props, rachaActual: 5, rachaMaxima: 5, ultimaActividadFecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      });
      perfil.registrarLeccionCompletada();
      expect(perfil.rachaActual).toBe(1);
      expect(perfil.rachaMaxima).toBe(5); // la máxima no se pierde, solo la actual se corta
    });

    it('racha_7_dias se gana al llegar la racha máxima a 7', () => {
      const perfil = crear();
      Object.defineProperty(perfil, 'props', {
        value: { ...(perfil as any).props, rachaActual: 6, rachaMaxima: 6, ultimaActividadFecha: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      const nuevas = perfil.registrarLeccionCompletada();
      expect(perfil.rachaActual).toBe(7);
      expect(nuevas).toContain('racha_7_dias');
    });
  });
});
