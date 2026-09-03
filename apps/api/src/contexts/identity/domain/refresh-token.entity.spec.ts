import { RefreshToken } from './refresh-token.entity';

describe('RefreshToken', () => {
  it('un token recién creado es válido', () => {
    const token = RefreshToken.crear('t1', 'usuario-1', 'hash-abc');
    expect(token.esValido).toBe(true);
    expect(token.revocado).toBe(false);
  });

  it('revocar() lo invalida', () => {
    const token = RefreshToken.crear('t1', 'usuario-1', 'hash-abc');
    token.revocar();
    expect(token.esValido).toBe(false);
    expect(token.revocado).toBe(true);
  });

  it('un token expirado no es válido aunque no esté revocado', () => {
    const token = RefreshToken.crear('t1', 'usuario-1', 'hash-abc', -1); // vigenciaDias negativa = ya vencido
    expect(token.esValido).toBe(false);
  });
});
