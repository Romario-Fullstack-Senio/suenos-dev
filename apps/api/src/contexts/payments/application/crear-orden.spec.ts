import { CrearOrdenUseCase } from './crear-orden.use-case';
import { Cupon } from '../domain/cupon.entity';

describe('CrearOrdenUseCase', () => {
  let useCase: CrearOrdenUseCase;
  let mockOrdenRepo: { save: jest.Mock };
  let mockPaymentIntent: { createPaymentIntent: jest.Mock };
  let mockCuponRepo: { findByCodigo: jest.Mock; save: jest.Mock };

  const command = {
    estudianteId: 'estudiante-1',
    cursoId: 'curso-1',
    precio: 100,
    cursoNombre: 'Curso de React',
    successUrl: 'http://localhost/success',
    cancelUrl: 'http://localhost/cancel',
  };

  beforeEach(() => {
    mockOrdenRepo = { save: jest.fn().mockResolvedValue(undefined) };
    mockPaymentIntent = {
      createPaymentIntent: jest.fn().mockResolvedValue({ clientSecret: 'secret_123', paymentIntentId: 'pi_123' }),
    };
    mockCuponRepo = { findByCodigo: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new CrearOrdenUseCase(mockOrdenRepo as any, mockPaymentIntent as any, mockCuponRepo as any);
  });

  it('crea la orden por el precio completo cuando no hay cupón', async () => {
    const result = await useCase.execute(command);

    expect(result.precioFinal).toBe(100);
    expect(result.descuento).toBe(0);
    expect(mockPaymentIntent.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100 }),
    );
    expect(mockOrdenRepo.save).toHaveBeenCalledTimes(1);
    expect(mockOrdenRepo.save.mock.calls[0][0].monto).toBe(100);
  });

  it('aplica el descuento del cupón y registra su uso', async () => {
    const cupon = Cupon.crear('cupon-1', { codigo: 'DIEZ', tipo: 'porcentaje', valor: 10 });
    mockCuponRepo.findByCodigo.mockResolvedValue(cupon);

    const result = await useCase.execute({ ...command, cuponCodigo: 'diez' });

    expect(result.descuento).toBe(10);
    expect(result.precioFinal).toBe(90);
    expect(mockPaymentIntent.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 90 }),
    );
    expect(cupon.usosActuales).toBe(1);
    expect(mockCuponRepo.save).toHaveBeenCalledWith(cupon);
  });

  it('lanza NotFoundDomainError si el código de cupón no existe', async () => {
    mockCuponRepo.findByCodigo.mockResolvedValue(null);

    await expect(useCase.execute({ ...command, cuponCodigo: 'NOEXISTE' })).rejects.toThrow('Cupón no encontrado');
    expect(mockOrdenRepo.save).not.toHaveBeenCalled();
  });

  it('rechaza un cupón que no aplica al curso y no consume su uso', async () => {
    const cupon = Cupon.crear('cupon-1', { codigo: 'SOLO-A', tipo: 'porcentaje', valor: 10, cursoId: 'otro-curso' });
    mockCuponRepo.findByCodigo.mockResolvedValue(cupon);

    await expect(useCase.execute({ ...command, cuponCodigo: 'SOLO-A' })).rejects.toThrow(
      'Este cupón no aplica a este curso',
    );
    expect(cupon.usosActuales).toBe(0);
    expect(mockOrdenRepo.save).not.toHaveBeenCalled();
    expect(mockCuponRepo.save).not.toHaveBeenCalled();
  });
});
