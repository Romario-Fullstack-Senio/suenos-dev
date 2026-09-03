import { Cupon } from './cupon.entity';

describe('Cupon', () => {
  it('crea un cupón porcentual global válido', () => {
    const cupon = Cupon.crear('cupon-1', { codigo: 'bienvenida10', tipo: 'porcentaje', valor: 10 });

    expect(cupon.codigo).toBe('BIENVENIDA10'); // se normaliza a mayúsculas
    expect(cupon.activo).toBe(true);
    expect(cupon.usosActuales).toBe(0);
    expect(cupon.cursoId).toBeUndefined();
  });

  it('rechaza un descuento porcentual fuera de 1-100', () => {
    expect(() => Cupon.crear('c1', { codigo: 'MAL', tipo: 'porcentaje', valor: 0 })).toThrow(
      'El descuento porcentual debe estar entre 1 y 100',
    );
    expect(() => Cupon.crear('c1', { codigo: 'MAL', tipo: 'porcentaje', valor: 150 })).toThrow(
      'El descuento porcentual debe estar entre 1 y 100',
    );
  });

  it('rechaza un monto fijo no positivo', () => {
    expect(() => Cupon.crear('c1', { codigo: 'MAL', tipo: 'monto_fijo', valor: 0 })).toThrow(
      'El monto de descuento debe ser positivo',
    );
  });

  it('rechaza un código demasiado corto', () => {
    expect(() => Cupon.crear('c1', { codigo: 'AB', tipo: 'porcentaje', valor: 10 })).toThrow(
      'El código del cupón debe tener al menos 3 caracteres',
    );
  });

  it('calcula el descuento porcentual correctamente', () => {
    const cupon = Cupon.crear('c1', { codigo: 'DIEZ', tipo: 'porcentaje', valor: 10 });
    expect(cupon.calcularDescuento(100)).toBe(10);
  });

  it('calcula el descuento de monto fijo sin superar el precio', () => {
    const cupon = Cupon.crear('c1', { codigo: 'CINCO', tipo: 'monto_fijo', valor: 5 });
    expect(cupon.calcularDescuento(100)).toBe(5);
    expect(cupon.calcularDescuento(3)).toBe(3); // nunca más que el precio
  });

  it('es inválido si está desactivado', () => {
    const cupon = Cupon.crear('c1', { codigo: 'DIEZ', tipo: 'porcentaje', valor: 10 });
    cupon.desactivar();
    const resultado = cupon.esValidoPara('curso-1');
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toMatch(/ya no está activo/);
  });

  it('es inválido si ya expiró', () => {
    const cupon = Cupon.crear('c1', {
      codigo: 'VIEJO',
      tipo: 'porcentaje',
      valor: 10,
      fechaExpiracion: new Date('2000-01-01'),
    });
    const resultado = cupon.esValidoPara('curso-1');
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toMatch(/expirado/);
  });

  it('es inválido si alcanzó el límite de usos', () => {
    const cupon = Cupon.crear('c1', { codigo: 'LIMITADO', tipo: 'porcentaje', valor: 10, usosMaximos: 1 });
    cupon.registrarUso();
    const resultado = cupon.esValidoPara('curso-1');
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toMatch(/límite de usos/);
  });

  it('es inválido para un curso distinto al que está scopeado', () => {
    const cupon = Cupon.crear('c1', { codigo: 'SOLO-A', tipo: 'porcentaje', valor: 10, cursoId: 'curso-A' });
    expect(cupon.esValidoPara('curso-A').valido).toBe(true);
    const resultado = cupon.esValidoPara('curso-B');
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toMatch(/no aplica a este curso/);
  });

  it('un cupón global es válido para cualquier curso', () => {
    const cupon = Cupon.crear('c1', { codigo: 'GLOBAL', tipo: 'porcentaje', valor: 10 });
    expect(cupon.esValidoPara('curso-cualquiera').valido).toBe(true);
  });

  it('registrarUso incrementa el contador', () => {
    const cupon = Cupon.crear('c1', { codigo: 'USO', tipo: 'porcentaje', valor: 10 });
    cupon.registrarUso();
    cupon.registrarUso();
    expect(cupon.usosActuales).toBe(2);
  });
});
