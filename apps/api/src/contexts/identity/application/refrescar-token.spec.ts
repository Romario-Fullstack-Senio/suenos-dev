import { RefrescarTokenUseCase } from './refrescar-token.use-case';
import { RefreshToken } from '../domain/refresh-token.entity';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { Password } from '../domain/password.value-object';

describe('RefrescarTokenUseCase', () => {
  let useCase: RefrescarTokenUseCase;
  let mockUsuarioRepo: { findById: jest.Mock };
  let mockRefreshRepo: { findByTokenHash: jest.Mock; save: jest.Mock };
  let mockJwt: { sign: jest.Mock };

  beforeEach(async () => {
    const password = await Password.create('password123');
    const usuario = Usuario.create('u1', 'Ana', Email.create('ana@test.com'), password);

    mockUsuarioRepo = { findById: jest.fn().mockResolvedValue(usuario) };
    mockRefreshRepo = {
      findByTokenHash: jest.fn().mockResolvedValue(RefreshToken.crear('rt1', 'u1', 'hash-existente', 'family-1')),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockJwt = { sign: jest.fn().mockReturnValue('nuevo.jwt.token') };
    useCase = new RefrescarTokenUseCase(mockUsuarioRepo as any, mockRefreshRepo as any, mockJwt as any);
  });

  it('rota el refresh token: revoca el viejo y emite uno nuevo', async () => {
    const result = await useCase.execute('token-plano-cualquiera');

    expect(result.token).toBe('nuevo.jwt.token');
    expect(result.refreshToken).toBeTruthy();
    // save() se llama 2 veces: una para revocar el viejo, otra para guardar el nuevo
    expect(mockRefreshRepo.save).toHaveBeenCalledTimes(2);
    expect(mockRefreshRepo.save.mock.calls[0][0].revocado).toBe(true);
  });

  it('rechaza un refresh token que no existe', async () => {
    mockRefreshRepo.findByTokenHash.mockResolvedValue(null);
    await expect(useCase.execute('token-invalido')).rejects.toThrow('Sesión expirada');
  });

  it('rechaza un refresh token ya revocado', async () => {
    const revocado = RefreshToken.crear('rt1', 'u1', 'hash', 'family-1');
    revocado.revocar();
    mockRefreshRepo.findByTokenHash.mockResolvedValue(revocado);
    await expect(useCase.execute('token-revocado')).rejects.toThrow('Sesión expirada');
  });
});
