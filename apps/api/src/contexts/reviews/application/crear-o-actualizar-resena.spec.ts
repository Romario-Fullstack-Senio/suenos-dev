import { CrearOActualizarResenaUseCase } from './crear-o-actualizar-resena.use-case';
import { Inscripcion } from '../../enrollment/domain/inscripcion.entity';
import { Resena } from '../domain/resena.entity';

describe('CrearOActualizarResenaUseCase', () => {
  let useCase: CrearOActualizarResenaUseCase;
  let mockResenaRepo: { findByCursoYEstudiante: jest.Mock; save: jest.Mock };
  let mockInscripcionRepo: { findByCursoYEstudiante: jest.Mock };
  let mockUsuarioRepo: { findById: jest.Mock };

  beforeEach(() => {
    mockResenaRepo = { findByCursoYEstudiante: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockInscripcionRepo = {
      findByCursoYEstudiante: jest.fn().mockResolvedValue(Inscripcion.crear('i1', 'estudiante-1', 'curso-1')),
    };
    mockUsuarioRepo = { findById: jest.fn().mockResolvedValue({ nombre: 'Ana' }) };
    useCase = new CrearOActualizarResenaUseCase(mockResenaRepo as any, mockInscripcionRepo as any, mockUsuarioRepo as any);
  });

  it('crea una reseña nueva si el estudiante está inscripto', async () => {
    mockResenaRepo.findByCursoYEstudiante.mockResolvedValue(null);

    await useCase.execute({ cursoId: 'curso-1', estudianteId: 'estudiante-1', calificacion: 5, comentario: 'Genial' });

    expect(mockResenaRepo.save).toHaveBeenCalledTimes(1);
    expect(mockResenaRepo.save.mock.calls[0][0].calificacion).toBe(5);
    expect(mockResenaRepo.save.mock.calls[0][0].estudianteNombre).toBe('Ana');
  });

  it('actualiza la reseña existente en vez de crear una duplicada', async () => {
    const existente = Resena.crear('r1', { cursoId: 'curso-1', estudianteId: 'estudiante-1', estudianteNombre: 'Ana', calificacion: 2 });
    mockResenaRepo.findByCursoYEstudiante.mockResolvedValue(existente);

    const result = await useCase.execute({ cursoId: 'curso-1', estudianteId: 'estudiante-1', calificacion: 5 });

    expect(result.id).toBe('r1');
    expect(mockResenaRepo.save.mock.calls[0][0].calificacion).toBe(5);
  });

  it('rechaza si el estudiante no está inscripto', async () => {
    mockInscripcionRepo.findByCursoYEstudiante.mockResolvedValue(null);

    await expect(
      useCase.execute({ cursoId: 'curso-1', estudianteId: 'estudiante-1', calificacion: 5 }),
    ).rejects.toThrow('Solo podés dejar una reseña si estás inscripto');
    expect(mockResenaRepo.save).not.toHaveBeenCalled();
  });

  it('rechaza si la inscripción está desactivada (reembolsada)', async () => {
    const desactivada = Inscripcion.crear('i1', 'estudiante-1', 'curso-1');
    desactivada.desactivar();
    mockInscripcionRepo.findByCursoYEstudiante.mockResolvedValue(desactivada);

    await expect(
      useCase.execute({ cursoId: 'curso-1', estudianteId: 'estudiante-1', calificacion: 5 }),
    ).rejects.toThrow('Solo podés dejar una reseña si estás inscripto');
  });
});
