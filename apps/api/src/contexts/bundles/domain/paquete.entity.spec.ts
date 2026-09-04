import { Paquete } from './paquete.entity';

describe('Paquete', () => {
  it('se crea con los cursos únicos y activo por defecto', () => {
    const paquete = Paquete.crear('p1', {
      titulo: 'Combo Frontend',
      descripcion: 'React + Next.js',
      cursoIds: ['c1', 'c2', 'c1'],
      descuentoPorcentaje: 20,
    });

    expect(paquete.cursoIds).toEqual(['c1', 'c2']);
    expect(paquete.activo).toBe(true);
  });

  it('rechaza un paquete con menos de 2 cursos distintos', () => {
    expect(() =>
      Paquete.crear('p1', { titulo: 'Solo', descripcion: '', cursoIds: ['c1', 'c1'], descuentoPorcentaje: 10 }),
    ).toThrow('al menos 2 cursos');
  });

  it('rechaza un descuento fuera de rango', () => {
    expect(() =>
      Paquete.crear('p1', { titulo: 'Combo', descripcion: '', cursoIds: ['c1', 'c2'], descuentoPorcentaje: 95 }),
    ).toThrow('entre 1% y 90%');
  });

  describe('coincideCon', () => {
    const paquete = Paquete.crear('p1', {
      titulo: 'Combo',
      descripcion: '',
      cursoIds: ['c1', 'c2'],
      descuentoPorcentaje: 15,
    });

    it('true cuando el carrito trae exactamente los mismos cursos', () => {
      expect(paquete.coincideCon(['c2', 'c1'])).toBe(true);
    });

    it('false si falta un curso', () => {
      expect(paquete.coincideCon(['c1'])).toBe(false);
    });

    it('false si trae un curso de más', () => {
      expect(paquete.coincideCon(['c1', 'c2', 'c3'])).toBe(false);
    });
  });

  it('cambiarEstado desactiva el paquete', () => {
    const paquete = Paquete.crear('p1', { titulo: 'Combo', descripcion: '', cursoIds: ['c1', 'c2'], descuentoPorcentaje: 10 });
    paquete.cambiarEstado(false);
    expect(paquete.activo).toBe(false);
  });
});
