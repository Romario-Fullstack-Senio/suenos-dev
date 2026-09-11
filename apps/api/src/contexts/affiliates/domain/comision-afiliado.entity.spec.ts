import { ComisionAfiliado } from './comision-afiliado.entity';

function crear(monto = 100) {
  return ComisionAfiliado.crear('c1', {
    afiliadoId: 'afiliado-1',
    referidoId: 'referido-1',
    cursoId: 'curso-1',
    cursoNombre: 'Curso de Prueba',
    ordenId: 'orden-1',
    monto,
  });
}

describe('ComisionAfiliado', () => {
  it('calcula el 20% del monto como comisión', () => {
    const comision = crear(100);
    expect(comision.comisionMonto).toBe(20);
  });

  it('redondea la comisión a 2 decimales', () => {
    const comision = crear(24.99);
    expect(comision.comisionMonto).toBe(5);
  });

  it('arranca en estado pendiente', () => {
    const comision = crear();
    expect(comision.estado).toBe('pendiente');
  });

  it('rechaza que un usuario cobre comisión por su propia compra', () => {
    expect(() =>
      ComisionAfiliado.crear('c1', {
        afiliadoId: 'u1',
        referidoId: 'u1',
        cursoId: 'curso-1',
        cursoNombre: 'Curso',
        ordenId: 'orden-1',
        monto: 100,
      }),
    ).toThrow('propia compra');
  });

  it('marcarPagada() cambia el estado', () => {
    const comision = crear();
    comision.marcarPagada();
    expect(comision.estado).toBe('pagada');
  });

  it('marcarPagada() dos veces rechaza la segunda', () => {
    const comision = crear();
    comision.marcarPagada();
    expect(() => comision.marcarPagada()).toThrow('ya estaba marcada como pagada');
  });
});
