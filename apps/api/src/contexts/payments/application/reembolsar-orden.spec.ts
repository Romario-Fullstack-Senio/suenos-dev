import { ReembolsarOrdenUseCase } from './reembolsar-orden.use-case';
import { Orden } from '../domain/orden.entity';
import { Inscripcion } from '../../enrollment/domain/inscripcion.entity';

function crearOrdenCompletada(hace = 0) {
  const orden = Orden.restore(
    'o1',
    'estudiante-1',
    'curso-1',
    49.99,
    'usd',
    'pi_123',
    'completada',
    new Date(Date.now() - hace * 24 * 60 * 60 * 1000),
  );
  return orden;
}

describe('ReembolsarOrdenUseCase', () => {
  let useCase: ReembolsarOrdenUseCase;
  let mockOrdenRepo: { findById: jest.Mock; save: jest.Mock };
  let mockStripe: { refund: jest.Mock };
  let mockInscripcionRepo: { findByCursoYEstudiante: jest.Mock; save: jest.Mock };
  let mockEventBus: { publish: jest.Mock };

  beforeEach(() => {
    mockOrdenRepo = { findById: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockStripe = { refund: jest.fn().mockResolvedValue({ refundId: 're_123' }) };
    mockInscripcionRepo = {
      findByCursoYEstudiante: jest.fn().mockResolvedValue(Inscripcion.crear('i1', 'estudiante-1', 'curso-1')),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    useCase = new ReembolsarOrdenUseCase(
      mockOrdenRepo as any,
      mockStripe as any,
      mockInscripcionRepo as any,
      mockEventBus as any,
    );
  });

  it('un admin puede reembolsar cualquier orden, sin límite de tiempo', async () => {
    mockOrdenRepo.findById.mockResolvedValue(crearOrdenCompletada(30)); // hace 30 días

    await useCase.execute({ ordenId: 'o1', callerId: 'admin-1', callerRol: 'admin' });

    expect(mockStripe.refund).toHaveBeenCalledWith('pi_123');
    expect(mockOrdenRepo.save).toHaveBeenCalledTimes(1);
    expect(mockOrdenRepo.save.mock.calls[0][0].estado).toBe('reembolsada');
    expect(mockInscripcionRepo.save).toHaveBeenCalledTimes(1);
    expect(mockInscripcionRepo.save.mock.calls[0][0].activa).toBe(false);
  });

  it('el propio estudiante puede reembolsar dentro de la ventana de 7 días', async () => {
    mockOrdenRepo.findById.mockResolvedValue(crearOrdenCompletada(2));

    await expect(
      useCase.execute({ ordenId: 'o1', callerId: 'estudiante-1', callerRol: 'estudiante' }),
    ).resolves.not.toThrow();
    expect(mockStripe.refund).toHaveBeenCalled();
  });

  it('el estudiante NO puede reembolsar pasados los 7 días', async () => {
    mockOrdenRepo.findById.mockResolvedValue(crearOrdenCompletada(10));

    await expect(
      useCase.execute({ ordenId: 'o1', callerId: 'estudiante-1', callerRol: 'estudiante' }),
    ).rejects.toThrow('días desde la compra');
    expect(mockStripe.refund).not.toHaveBeenCalled();
  });

  it('un estudiante no puede reembolsar la orden de otro', async () => {
    mockOrdenRepo.findById.mockResolvedValue(crearOrdenCompletada(1));

    await expect(
      useCase.execute({ ordenId: 'o1', callerId: 'otro-estudiante', callerRol: 'estudiante' }),
    ).rejects.toThrow('No tenés permiso');
    expect(mockStripe.refund).not.toHaveBeenCalled();
  });

  it('lanza NotFoundDomainError si la orden no existe', async () => {
    mockOrdenRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ ordenId: 'no-existe', callerId: 'x', callerRol: 'admin' }),
    ).rejects.toThrow('Orden no encontrada');
  });
});
