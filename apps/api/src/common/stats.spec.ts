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
  it('suma ingresos REALES desde las Ordenes completadas (no una estimación por precio actual)', async () => {
    const cursoBarato = { id: 'curso-a', precio: { value: 10 } };
    const cursoCaro = { id: 'curso-b', precio: { value: 100 } };

    const mockCursoRepo = {
      findByInstructorId: jest.fn().mockResolvedValue([cursoBarato, cursoCaro]),
    };
    const mockInscripcionRepo = {
      findByCursoId: jest.fn((cursoId: string) => {
        if (cursoId === 'curso-a') return Promise.resolve([{ activa: true }, { activa: true }, { activa: false }]);
        if (cursoId === 'curso-b') return Promise.resolve([{ activa: true }]);
        return Promise.resolve([]);
      }),
    };
    const mockOrdenRepo = {
      findByCursoIds: jest.fn().mockResolvedValue([
        { estado: 'completada', items: [{ cursoId: 'curso-a', precio: 10 }] },
        { estado: 'completada', items: [{ cursoId: 'curso-a', precio: 10 }] },
        { estado: 'reembolsada', items: [{ cursoId: 'curso-a', precio: 10 }] }, // no debe sumar
        { estado: 'completada', items: [{ cursoId: 'curso-b', precio: 100 }] },
      ]),
    };
    const mockProgresoRepo = { findByCursoId: jest.fn().mockResolvedValue([]) };

    const controller = new InstructorController(
      mockCursoRepo as any,
      mockInscripcionRepo as any,
      mockOrdenRepo as any,
      mockProgresoRepo as any,
    );
    const stats = await controller.getStats('instructor-1');

    // Solo cuenta inscripciones ACTIVAS: 2 (curso-a) + 1 (curso-b) = 3.
    expect(stats.totalInscripciones).toBe(3);
    // Solo Ordenes 'completada': 10 + 10 + 100 = 120 (la reembolsada no suma).
    expect(stats.ingresosEstimados).toBe(120);
  });

  it('devuelve 0 ingresos si el instructor no tiene cursos', async () => {
    const mockCursoRepo = { findByInstructorId: jest.fn().mockResolvedValue([]) };
    const mockInscripcionRepo = { findByCursoId: jest.fn() };
    const mockOrdenRepo = { findByCursoIds: jest.fn().mockResolvedValue([]) };
    const mockProgresoRepo = { findByCursoId: jest.fn() };

    const controller = new InstructorController(
      mockCursoRepo as any,
      mockInscripcionRepo as any,
      mockOrdenRepo as any,
      mockProgresoRepo as any,
    );
    const stats = await controller.getStats('instructor-sin-cursos');

    expect(stats).toEqual({ totalCursos: 0, totalInscripciones: 0, ingresosEstimados: 0 });
  });
});

describe('InstructorController.getAnalytics', () => {
  it('calcula ventas por curso y tasa de finalización', async () => {
    const curso = {
      id: 'curso-a',
      titulo: 'Curso A',
      modulos: [{ lecciones: [{ id: 'l1' }, { id: 'l2' }] }], // 2 lecciones en total
    };
    const mockCursoRepo = { findByInstructorId: jest.fn().mockResolvedValue([curso]) };
    const mockInscripcionRepo = {
      findByCursoId: jest.fn().mockResolvedValue([
        { estudianteId: 'e1', activa: true },
        { estudianteId: 'e2', activa: true },
      ]),
    };
    const mockOrdenRepo = {
      findByCursoIds: jest.fn().mockResolvedValue([
        { estado: 'completada', items: [{ cursoId: 'curso-a', precio: 50 }], createdAt: new Date() },
      ]),
    };
    const mockProgresoRepo = {
      // e1 completó las 2 lecciones (100% >= 90% → cuenta como terminado);
      // e2 solo completó 1 de 2 (50% < 90% → no cuenta).
      findByCursoId: jest.fn().mockResolvedValue([
        { estudianteId: 'e1', completada: true },
        { estudianteId: 'e1', completada: true },
        { estudianteId: 'e2', completada: true },
      ]),
    };

    const controller = new InstructorController(
      mockCursoRepo as any,
      mockInscripcionRepo as any,
      mockOrdenRepo as any,
      mockProgresoRepo as any,
    );
    const analytics = await controller.getAnalytics('instructor-1');

    expect(analytics.ventasPorCurso).toEqual([{ cursoId: 'curso-a', cursoNombre: 'Curso A', ventas: 1, ingresos: 50 }]);
    expect(analytics.tasaFinalizacionPorCurso).toEqual([
      { cursoId: 'curso-a', cursoNombre: 'Curso A', inscriptos: 2, completaron: 1, tasa: 50 },
    ]);
    expect(analytics.ingresosPorDia).toHaveLength(30);
    expect(analytics.ingresosPorDia[29].monto).toBe(50); // hoy
  });
});
