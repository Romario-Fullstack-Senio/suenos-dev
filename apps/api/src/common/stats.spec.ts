import { AdminController } from './admin.controller';
import { InstructorController } from './instructor.controller';

describe('AdminController.getStats', () => {
  it('cuenta las inscripciones reales (antes estaba hardcodeado en 0)', async () => {
    const mockUsuarioRepo = { findAll: jest.fn().mockResolvedValue([{}, {}]) };
    const mockCursoRepo = { findAll: jest.fn().mockResolvedValue([{}, {}, {}]) };
    const mockInscripcionRepo = { findAll: jest.fn().mockResolvedValue([{}, {}, {}, {}, {}]) };

    const controller = new AdminController(mockUsuarioRepo as any, mockCursoRepo as any, mockInscripcionRepo as any);
    const stats = await controller.getStats();

    expect(stats).toEqual({ totalUsuarios: 2, totalCursos: 3, totalInscripciones: 5 });
  });
});

describe('InstructorController.getStats', () => {
  it('suma los ingresos por curso, cada uno con su propio precio (antes usaba solo el precio del primer curso)', async () => {
    const cursoBarato = { id: 'curso-a', precio: { value: 10 } };
    const cursoCaro = { id: 'curso-b', precio: { value: 100 } };

    const mockCursoRepo = {
      findByInstructorId: jest.fn().mockResolvedValue([cursoBarato, cursoCaro]),
    };
    const mockInscripcionRepo = {
      findByCursoId: jest.fn((cursoId: string) => {
        if (cursoId === 'curso-a') return Promise.resolve([{}, {}, {}]); // 3 inscripciones * $10
        if (cursoId === 'curso-b') return Promise.resolve([{}]); // 1 inscripción * $100
        return Promise.resolve([]);
      }),
    };

    const controller = new InstructorController(mockCursoRepo as any, mockInscripcionRepo as any);
    const stats = await controller.getStats('instructor-1');

    // Antes: (3+1) inscripciones * cursos[0].precio (10) = 40 — incorrecto.
    // Ahora: 3*10 + 1*100 = 130.
    expect(stats.totalInscripciones).toBe(4);
    expect(stats.ingresosEstimados).toBe(130);
  });

  it('devuelve 0 ingresos si el instructor no tiene cursos', async () => {
    const mockCursoRepo = { findByInstructorId: jest.fn().mockResolvedValue([]) };
    const mockInscripcionRepo = { findByCursoId: jest.fn() };

    const controller = new InstructorController(mockCursoRepo as any, mockInscripcionRepo as any);
    const stats = await controller.getStats('instructor-sin-cursos');

    expect(stats).toEqual({ totalCursos: 0, totalInscripciones: 0, ingresosEstimados: 0 });
  });
});
