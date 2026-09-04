import { Orden } from './orden.entity';

const ITEM_UNICO = [{ id: 'item-1', cursoId: 'curso-1', cursoNombre: 'Curso Uno', precio: 49.99 }];
const DOS_ITEMS = [
  { id: 'item-1', cursoId: 'curso-1', cursoNombre: 'Curso Uno', precio: 49.99 },
  { id: 'item-2', cursoId: 'curso-2', cursoNombre: 'Curso Dos', precio: 29.99 },
];

function crearOrdenCompletada(items = ITEM_UNICO) {
  const orden = Orden.crear('o1', 'estudiante-1', items, 'usd', 'pi_123');
  orden.completar();
  orden.pullDomainEvents(); // limpiar los eventos de completar antes de cada test
  return orden;
}

describe('Orden', () => {
  it('crear() rechaza una orden sin ítems', () => {
    expect(() => Orden.crear('o1', 'estudiante-1', [], 'usd', 'pi_123')).toThrow('al menos un ítem');
  });

  it('monto es la suma de todos los ítems', () => {
    const orden = Orden.crear('o1', 'estudiante-1', DOS_ITEMS, 'usd', 'pi_123');
    expect(orden.monto).toBeCloseTo(79.98);
  });

  it('completar() emite un evento CursoComprado por cada ítem', () => {
    const orden = Orden.crear('o1', 'estudiante-1', DOS_ITEMS, 'usd', 'pi_123');
    orden.completar({ email: 'a@test.com', nombre: 'Ana' });

    expect(orden.estado).toBe('completada');
    const eventos = orden.pullDomainEvents();
    expect(eventos).toHaveLength(2);
    expect(eventos.every(e => e.eventName === 'CursoComprado')).toBe(true);
    expect((eventos[0] as any).cursoId).toBe('curso-1');
    expect((eventos[1] as any).cursoId).toBe('curso-2');
  });

  it('reembolsar() marca la orden como reembolsada y emite un evento por ítem', () => {
    const orden = crearOrdenCompletada(DOS_ITEMS);
    orden.reembolsar();

    expect(orden.estado).toBe('reembolsada');
    const eventos = orden.pullDomainEvents();
    expect(eventos).toHaveLength(2);
    expect(eventos.every(e => e.eventName === 'OrdenReembolsada')).toBe(true);
  });

  it('no se puede reembolsar una orden pendiente', () => {
    const orden = Orden.crear('o1', 'estudiante-1', ITEM_UNICO, 'usd', 'pi_123');
    expect(() => orden.reembolsar()).toThrow('Solo se puede reembolsar una orden completada');
  });

  it('no se puede reembolsar dos veces', () => {
    const orden = crearOrdenCompletada();
    orden.reembolsar();
    expect(() => orden.reembolsar()).toThrow('Solo se puede reembolsar una orden completada');
  });

  it('restore() preserva la fecha real de creación cuando se pasa', () => {
    const fechaReal = new Date('2026-01-01T00:00:00Z');
    const orden = Orden.restore('o1', 'e1', ITEM_UNICO, 'usd', 'pi_123', 'completada', fechaReal);
    expect(orden.createdAt).toEqual(fechaReal);
  });
});
