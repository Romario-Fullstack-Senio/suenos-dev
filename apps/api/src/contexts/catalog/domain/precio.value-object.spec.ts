import { Precio } from './precio.value-object';

describe('Precio', () => {
  it('acepta un number normal', () => {
    expect(Precio.create(29.99).value).toBe(29.99);
  });

  it('coacciona un string numérico a number (pg devuelve columnas decimal así)', () => {
    const precio = Precio.create('29.99' as unknown as number);
    expect(precio.value).toBe(29.99);
    expect(typeof precio.value).toBe('number');
  });

  it('rechaza precios negativos, incluso como string', () => {
    expect(() => Precio.create('-5' as unknown as number)).toThrow('El precio no puede ser negativo');
  });
});
