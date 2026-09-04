import { CrearOrdenUseCase } from './crear-orden.use-case';
import { Cupon } from '../domain/cupon.entity';

// Cursos "reales" del lado servidor — el precio/nombre que manda el cliente
// en el command se ignora, así que estos son los valores que de verdad
// terminan usándose. Ver crear-orden.use-case.ts.
const CURSOS_REALES: Record<string, { id: string; titulo: string; precio: number }> = {
  'curso-1': { id: 'curso-1', titulo: 'Curso de React', precio: 100 },
  'curso-2': { id: 'curso-2', titulo: 'Curso de NestJS', precio: 50 },
};

function cursoFake(id: string) {
  const c = CURSOS_REALES[id];
  if (!c) return null;
  return { id: c.id, titulo: c.titulo, precio: { value: c.precio } };
}

describe('CrearOrdenUseCase', () => {
  let useCase: CrearOrdenUseCase;
  let mockOrdenRepo: { save: jest.Mock };
  let mockPaymentIntent: { createPaymentIntent: jest.Mock };
  let mockCuponRepo: { findByCodigo: jest.Mock; save: jest.Mock };
  let mockCursoRepo: { findById: jest.Mock };
  let mockPaqueteRepo: { findById: jest.Mock };

  const command = {
    estudianteId: 'estudiante-1',
    items: [{ cursoId: 'curso-1', cursoNombre: 'Curso de React', precio: 100 }],
    successUrl: 'http://localhost/success',
    cancelUrl: 'http://localhost/cancel',
  };

  beforeEach(() => {
    mockOrdenRepo = { save: jest.fn().mockResolvedValue(undefined) };
    mockPaymentIntent = {
      createPaymentIntent: jest.fn().mockResolvedValue({ clientSecret: 'secret_123', paymentIntentId: 'pi_123' }),
    };
    mockCuponRepo = { findByCodigo: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockCursoRepo = { findById: jest.fn((id: string) => Promise.resolve(cursoFake(id))) };
    mockPaqueteRepo = { findById: jest.fn().mockResolvedValue(null) };
    useCase = new CrearOrdenUseCase(
      mockOrdenRepo as any,
      mockPaymentIntent as any,
      mockCuponRepo as any,
      mockCursoRepo as any,
      mockPaqueteRepo as any,
    );
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

  it('crea una orden con varios cursos (carrito) y suma el total', async () => {
    const result = await useCase.execute({
      ...command,
      items: [
        { cursoId: 'curso-1', cursoNombre: 'Curso de React', precio: 100 },
        { cursoId: 'curso-2', cursoNombre: 'Curso de NestJS', precio: 50 },
      ],
    });

    expect(result.precioFinal).toBe(150);
    expect(mockPaymentIntent.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 150 }),
    );
    expect(mockOrdenRepo.save.mock.calls[0][0].items).toHaveLength(2);
  });

  it('rechaza un cupón cuando el carrito tiene más de un curso', async () => {
    await expect(
      useCase.execute({
        ...command,
        items: [
          { cursoId: 'curso-1', cursoNombre: 'Curso de React', precio: 100 },
          { cursoId: 'curso-2', cursoNombre: 'Curso de NestJS', precio: 50 },
        ],
        cuponCodigo: 'DIEZ',
      }),
    ).rejects.toThrow('un curso a la vez');
    expect(mockOrdenRepo.save).not.toHaveBeenCalled();
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

  it('aplica el descuento del paquete a cada ítem cuando el carrito coincide exactamente', async () => {
    const paquete = {
      activo: true,
      descuentoPorcentaje: 20,
      coincideCon: (ids: string[]) => ids.sort().join(',') === ['curso-1', 'curso-2'].join(','),
    };
    mockPaqueteRepo.findById.mockResolvedValue(paquete);

    const result = await useCase.execute({
      ...command,
      items: [
        { cursoId: 'curso-1', cursoNombre: 'Curso de React', precio: 100 },
        { cursoId: 'curso-2', cursoNombre: 'Curso de NestJS', precio: 50 },
      ],
      paqueteId: 'paquete-1',
    });

    // 150 de lista, 20% off = 120
    expect(result.precioFinal).toBe(120);
    expect(result.descuento).toBe(30);
    expect(mockPaymentIntent.createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({ amount: 120 }));
  });

  it('rechaza el paquete si el carrito no coincide exactamente con sus cursos', async () => {
    const paquete = { activo: true, descuentoPorcentaje: 20, coincideCon: () => false };
    mockPaqueteRepo.findById.mockResolvedValue(paquete);

    await expect(
      useCase.execute({ ...command, paqueteId: 'paquete-1' }),
    ).rejects.toThrow('El carrito no coincide con los cursos del paquete');
    expect(mockOrdenRepo.save).not.toHaveBeenCalled();
  });

  it('rechaza combinar cupón y paquete en la misma orden', async () => {
    await expect(
      useCase.execute({ ...command, cuponCodigo: 'DIEZ', paqueteId: 'paquete-1' }),
    ).rejects.toThrow('No se puede combinar un cupón con la compra de un paquete');
    expect(mockOrdenRepo.save).not.toHaveBeenCalled();
  });

  it('ignora el precio y nombre que manda el cliente y usa los reales del curso', async () => {
    const result = await useCase.execute({
      ...command,
      items: [{ cursoId: 'curso-1', cursoNombre: 'GRATIS TOTAL', precio: 0.01 }],
    });

    expect(result.precioFinal).toBe(100);
    expect(mockPaymentIntent.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100, cursoNombre: 'Curso de React' }),
    );
    expect(mockOrdenRepo.save.mock.calls[0][0].items[0].cursoNombre).toBe('Curso de React');
  });

  it('lanza NotFoundDomainError si el curso no existe', async () => {
    await expect(
      useCase.execute({ ...command, items: [{ cursoId: 'curso-inexistente', cursoNombre: 'x', precio: 1 }] }),
    ).rejects.toThrow('no encontrado');
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
