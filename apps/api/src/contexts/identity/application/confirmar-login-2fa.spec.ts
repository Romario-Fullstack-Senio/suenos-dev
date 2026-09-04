import { authenticator } from 'otplib';
import { ConfirmarLoginDosFactoresUseCase } from './confirmar-login-2fa.use-case';
import { LoginUseCase } from './login.use-case';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { Password } from '../domain/password.value-object';
import { hashToken } from './token-hash.util';

async function crearUsuarioCon2FA() {
  const password = await Password.create('password123');
  const usuario = Usuario.create('u1', 'Ana', Email.create('ana@test.com'), password);
  const secret = authenticator.generateSecret();
  usuario.iniciarConfiguracionDosFactores(secret);
  usuario.confirmarActivacionDosFactores([hashToken('abc12')]);
  return usuario;
}

describe('ConfirmarLoginDosFactoresUseCase', () => {
  let useCase: ConfirmarLoginDosFactoresUseCase;
  let mockUsuarioRepo: { findById: jest.Mock; save: jest.Mock };
  let mockJwt: { verify: jest.Mock };
  let mockLoginUseCase: { emitirTokens: jest.Mock };

  beforeEach(() => {
    mockUsuarioRepo = { findById: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockJwt = { verify: jest.fn() };
    mockLoginUseCase = { emitirTokens: jest.fn().mockResolvedValue({ token: 'real-token' }) };
    useCase = new ConfirmarLoginDosFactoresUseCase(
      mockUsuarioRepo as any,
      mockJwt as any,
      mockLoginUseCase as unknown as LoginUseCase,
    );
  });

  it('con un código TOTP válido, emite los tokens reales', async () => {
    const usuario = await crearUsuarioCon2FA();
    mockJwt.verify.mockReturnValue({ sub: 'u1', purpose: 'two-factor-pending' });
    mockUsuarioRepo.findById.mockResolvedValue(usuario);
    const codigoValido = authenticator.generate(usuario.twoFactorSecret!);

    const result = await useCase.execute({ tempToken: 'temp', codigo: codigoValido });

    expect(result).toEqual({ token: 'real-token' });
    expect(mockLoginUseCase.emitirTokens).toHaveBeenCalledWith(usuario);
  });

  it('con un código de respaldo válido, lo consume y emite los tokens reales', async () => {
    const usuario = await crearUsuarioCon2FA();
    mockJwt.verify.mockReturnValue({ sub: 'u1', purpose: 'two-factor-pending' });
    mockUsuarioRepo.findById.mockResolvedValue(usuario);

    const result = await useCase.execute({ tempToken: 'temp', codigo: 'abc12' });

    expect(result).toEqual({ token: 'real-token' });
    expect(usuario.twoFactorBackupCodes).toEqual([]); // se consumió, un solo uso
    expect(mockUsuarioRepo.save).toHaveBeenCalledWith(usuario);
  });

  it('con un código inválido (ni TOTP ni respaldo), lanza UnauthorizedException', async () => {
    const usuario = await crearUsuarioCon2FA();
    mockJwt.verify.mockReturnValue({ sub: 'u1', purpose: 'two-factor-pending' });
    mockUsuarioRepo.findById.mockResolvedValue(usuario);

    await expect(useCase.execute({ tempToken: 'temp', codigo: '000000' })).rejects.toThrow('Código incorrecto');
    expect(mockLoginUseCase.emitirTokens).not.toHaveBeenCalled();
  });

  it('un tempToken con purpose distinto de two-factor-pending es rechazado', async () => {
    mockJwt.verify.mockReturnValue({ sub: 'u1', purpose: 'session-hint' });

    await expect(useCase.execute({ tempToken: 'temp', codigo: '123456' })).rejects.toThrow('Token inválido');
  });

  it('un tempToken vencido/inválido es rechazado', async () => {
    mockJwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });

    await expect(useCase.execute({ tempToken: 'vencido', codigo: '123456' })).rejects.toThrow(
      'volvé a iniciar sesión',
    );
  });
});
