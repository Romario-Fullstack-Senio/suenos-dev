import { ResetPasswordUseCase } from './reset-password.use-case';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { Password } from '../domain/password.value-object';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockUsuarioRepo: { findByResetPasswordToken: jest.Mock; save: jest.Mock };
  let mockRefreshRepo: { revocarTodosDeUsuario: jest.Mock };

  beforeEach(async () => {
    const password = await Password.create('viejaPassword1');
    const usuario = Usuario.create('u1', 'Ana', Email.create('ana@test.com'), password);
    usuario.asignarTokenResetPassword('reset-tok');

    mockUsuarioRepo = {
      findByResetPasswordToken: jest.fn().mockResolvedValue(usuario),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockRefreshRepo = { revocarTodosDeUsuario: jest.fn().mockResolvedValue(undefined) };
    useCase = new ResetPasswordUseCase(mockUsuarioRepo as any, mockRefreshRepo as any);
  });

  it('cambia la contraseña y revoca todas las sesiones activas del usuario', async () => {
    await useCase.execute('reset-tok', 'nuevaPassword123');

    expect(mockUsuarioRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRefreshRepo.revocarTodosDeUsuario).toHaveBeenCalledWith('u1');
  });

  it('lanza NotFoundDomainError si el token no corresponde a ningún usuario', async () => {
    mockUsuarioRepo.findByResetPasswordToken.mockResolvedValue(null);
    await expect(useCase.execute('no-existe', 'nuevaPassword123')).rejects.toThrow(
      'El enlace de recuperación no es válido',
    );
    expect(mockRefreshRepo.revocarTodosDeUsuario).not.toHaveBeenCalled();
  });
});
