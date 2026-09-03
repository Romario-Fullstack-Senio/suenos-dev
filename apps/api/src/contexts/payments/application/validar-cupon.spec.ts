import { ValidarCuponUseCase } from './validar-cupon.use-case';
import { Cupon } from '../domain/cupon.entity';

describe('ValidarCuponUseCase', () => {
  let useCase: ValidarCuponUseCase;
  let mockCuponRepo: { findByCodigo: jest.Mock };

  beforeEach(() => {
    mockCuponRepo = { findByCodigo: jest.fn() };
    useCase = new ValidarCuponUseCase(mockCuponRepo as any);
  });

  it('devuelve el descuento y precio final sin registrar uso', async () => {
    const cupon = Cupon.crear('cupon-1', { codigo: 'DIEZ', tipo: 'porcentaje', valor: 10 });
    mockCuponRepo.findByCodigo.mockResolvedValue(cupon);

    const resultado = await useCase.execute({ codigo: 'diez', cursoId: 'curso-1', precio: 100 });

    expect(resultado).toEqual({ codigo: 'DIEZ', descuento: 10, precioFinal: 90 });
    expect(cupon.usosActuales).toBe(0); // solo previsualiza, no consume el cupón
  });

  it('lanza NotFoundDomainError si el cupón no existe', async () => {
    mockCuponRepo.findByCodigo.mockResolvedValue(null);

    await expect(useCase.execute({ codigo: 'NOEXISTE', cursoId: 'curso-1', precio: 100 })).rejects.toThrow(
      'Cupón no encontrado',
    );
  });

  it('lanza DomainError si el cupón expiró', async () => {
    const cupon = Cupon.crear('cupon-1', {
      codigo: 'VIEJO',
      tipo: 'porcentaje',
      valor: 10,
      fechaExpiracion: new Date('2000-01-01'),
    });
    mockCuponRepo.findByCodigo.mockResolvedValue(cupon);

    await expect(useCase.execute({ codigo: 'VIEJO', cursoId: 'curso-1', precio: 100 })).rejects.toThrow(
      'Este cupón ha expirado',
    );
  });
});
