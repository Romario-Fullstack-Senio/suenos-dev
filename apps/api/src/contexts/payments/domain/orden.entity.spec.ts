import { Orden } from './orden.entity';

function crearOrdenCompletada() {
  const orden = Orden.crear('o1', 'estudiante-1', 'curso-1', 49.99, 'usd', 'pi_123');
  orden.completar();
  orden.pullDomainEvents(); // limpiar el evento de completar antes de cada test
  return orden;
}

describe('Orden', () => {
  it('reembolsar() marca la orden como reembolsada y emite un evento', () => {
    const orden = crearOrdenCompletada();
    orden.reembolsar();

    expect(orden.estado).toBe('reembolsada');
    const eventos = orden.pullDomainEvents();
    expect(eventos).toHaveLength(1);
    expect(eventos[0].eventName).toBe('OrdenReembolsada');
  });

  it('no se puede reembolsar una orden pendiente', () => {
    const orden = Orden.crear('o1', 'estudiante-1', 'curso-1', 49.99, 'usd', 'pi_123');
    expect(() => orden.reembolsar()).toThrow('Solo se puede reembolsar una orden completada');
  });

  it('no se puede reembolsar dos veces', () => {
    const orden = crearOrdenCompletada();
    orden.reembolsar();
    expect(() => orden.reembolsar()).toThrow('Solo se puede reembolsar una orden completada');
  });

  it('restore() preserva la fecha real de creación cuando se pasa', () => {
    const fechaReal = new Date('2026-01-01T00:00:00Z');
    const orden = Orden.restore('o1', 'e1', 'c1', 49.99, 'usd', 'pi_123', 'completada', fechaReal);
    expect(orden.createdAt).toEqual(fechaReal);
  });
});
