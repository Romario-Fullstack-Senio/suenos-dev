import { LoginUseCase } from './login.use-case';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { Password } from '../domain/password.value-object';

async function crearUsuarioConPassword(plain: string) {
  const password = await Password.create(plain);
  return Usuario.create('u1', 'Ana', Email.create('ana@test.com'), password);
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUsuarioRepo: { findByEmail: jest.Mock };
  let mockRefreshTokenRepo: { save: jest.Mock };
  let mockJwt: { sign: jest.Mock };

  beforeEach(() => {
    mockUsuarioRepo = { findByEmail: jest.fn() };
    mockRefreshTokenRepo = { save: jest.fn().mockResolvedValue(undefined) };
    mockJwt = { sign: jest.fn().mockReturnValue('signed-jwt') };
    useCase = new LoginUseCase(mockUsuarioRepo as any, mockRefreshTokenRepo as any, mockJwt as any);
  });

  it('sin 2FA activado, devuelve los tokens completos directamente', async () => {
    const usuario = await crearUsuarioConPassword('password123');
    mockUsuarioRepo.findByEmail.mockResolvedValue(usuario);

    const result = await useCase.execute({ email: 'ana@test.com', password: 'password123' });

    expect('requiresTwoFactor' in result).toBe(false);
    expect((result as any).token).toBe('signed-jwt');
    expect(mockRefreshTokenRepo.save).toHaveBeenCalledTimes(1);
  });

  it('con 2FA activado, NO emite tokens reales — devuelve un tempToken pendiente', async () => {
    const usuario = await crearUsuarioConPassword('password123');
    usuario.iniciarConfiguracionDosFactores('SECRETO123');
    usuario.confirmarActivacionDosFactores(['hash1']);
    mockUsuarioRepo.findByEmail.mockResolvedValue(usuario);

    const result = await useCase.execute({ email: 'ana@test.com', password: 'password123' });

    expect(result).toEqual({ requiresTwoFactor: true, tempToken: 'signed-jwt' });
    expect(mockRefreshTokenRepo.save).not.toHaveBeenCalled();
    // El tempToken debe llevar purpose: 'two-factor-pending', no un access
    // token normal — JwtStrategy lo rechaza explícitamente por esto.
    expect(mockJwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: 'two-factor-pending' }),
      expect.any(Object),
    );
  });

  it('contraseña incorrecta lanza UnauthorizedException sin revelar si el email existe', async () => {
    const usuario = await crearUsuarioConPassword('password123');
    mockUsuarioRepo.findByEmail.mockResolvedValue(usuario);

    await expect(useCase.execute({ email: 'ana@test.com', password: 'mala' })).rejects.toThrow(
      'Credenciales inválidas',
    );
  });

  it('email inexistente lanza UnauthorizedException', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute({ email: 'no-existe@test.com', password: 'x' })).rejects.toThrow(
      'Credenciales inválidas',
    );
  });
});
