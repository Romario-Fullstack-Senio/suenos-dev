import { Usuario } from './usuario.entity';
import { Email } from './email.value-object';
import { Password } from './password.value-object';
import { AuthProviderTipo } from './auth-provider.value-object';

async function crearUsuario(verificacionToken?: string) {
  const password = await Password.create('password123');
  return Usuario.create('u1', 'Ana', Email.create('ana@test.com'), password, undefined, verificacionToken);
}

describe('Usuario — verificación de email', () => {
  it('un usuario nuevo por registro local arranca sin verificar', async () => {
    const usuario = await crearUsuario('tok-123');
    expect(usuario.emailVerificado).toBe(false);
  });

  it('una cuenta OAuth arranca verificada (el proveedor ya lo confirmó)', () => {
    const usuario = Usuario.registrarDesdeOAuth({
      id: 'u2',
      nombre: 'Ana',
      email: Email.create('ana@test.com'),
      provider: AuthProviderTipo.GOOGLE,
      providerId: 'google-123',
    });
    expect(usuario.emailVerificado).toBe(true);
  });

  it('verificarEmail con el token correcto marca la cuenta como verificada', async () => {
    const usuario = await crearUsuario('tok-123');
    usuario.verificarEmail('tok-123');
    expect(usuario.emailVerificado).toBe(true);
    expect(usuario.verificacionToken).toBeNull();
  });

  it('verificarEmail con un token incorrecto lanza DomainError', async () => {
    const usuario = await crearUsuario('tok-123');
    expect(() => usuario.verificarEmail('otro-token')).toThrow('El enlace de verificación no es válido');
  });

  it('verificarEmail con un token expirado lanza DomainError', async () => {
    const usuario = await crearUsuario('tok-123');
    usuario.asignarTokenVerificacion('tok-vencido', -1); // ya vencido
    expect(() => usuario.verificarEmail('tok-vencido')).toThrow('expiró');
  });

  it('verificarEmail es idempotente si ya está verificado', async () => {
    const usuario = await crearUsuario('tok-123');
    usuario.verificarEmail('tok-123');
    expect(() => usuario.verificarEmail('cualquier-cosa')).not.toThrow();
  });
});

describe('Usuario — reset de contraseña', () => {
  it('resetearPassword con token correcto cambia la contraseña y consume el token', async () => {
    const usuario = await crearUsuario();
    usuario.asignarTokenResetPassword('reset-tok');
    await usuario.resetearPassword('reset-tok', 'nuevaPassword123');

    expect(usuario.resetPasswordToken).toBeNull();
    await expect(usuario.verificarPassword('nuevaPassword123')).resolves.toBe(true);
    await expect(usuario.verificarPassword('password123')).resolves.toBe(false);
  });

  it('resetearPassword con token incorrecto lanza DomainError', async () => {
    const usuario = await crearUsuario();
    usuario.asignarTokenResetPassword('reset-tok');
    await expect(usuario.resetearPassword('token-malo', 'nuevaPassword123')).rejects.toThrow(
      'El enlace de recuperación no es válido',
    );
  });

  it('resetearPassword con token expirado lanza DomainError', async () => {
    const usuario = await crearUsuario();
    usuario.asignarTokenResetPassword('reset-tok', -1);
    await expect(usuario.resetearPassword('reset-tok', 'nuevaPassword123')).rejects.toThrow('expiró');
  });
});

describe('Usuario — verificación en dos pasos (2FA)', () => {
  it('un usuario nuevo arranca sin 2FA activado', async () => {
    const usuario = await crearUsuario();
    expect(usuario.twoFactorEnabled).toBe(false);
    expect(usuario.twoFactorSecret).toBeNull();
  });

  it('iniciarConfiguracionDosFactores guarda el secreto pero no activa 2FA todavía', async () => {
    const usuario = await crearUsuario();
    usuario.iniciarConfiguracionDosFactores('SECRETO123');
    expect(usuario.twoFactorSecret).toBe('SECRETO123');
    expect(usuario.twoFactorEnabled).toBe(false);
  });

  it('confirmarActivacionDosFactores sin haber iniciado la configuración lanza DomainError', async () => {
    const usuario = await crearUsuario();
    expect(() => usuario.confirmarActivacionDosFactores(['hash1'])).toThrow(
      'Primero tenés que iniciar la configuración',
    );
  });

  it('confirmarActivacionDosFactores activa 2FA y guarda los códigos de respaldo', async () => {
    const usuario = await crearUsuario();
    usuario.iniciarConfiguracionDosFactores('SECRETO123');
    usuario.confirmarActivacionDosFactores(['hash1', 'hash2']);
    expect(usuario.twoFactorEnabled).toBe(true);
    expect(usuario.twoFactorBackupCodes).toEqual(['hash1', 'hash2']);
  });

  it('iniciarConfiguracionDosFactores con 2FA ya activado lanza DomainError', async () => {
    const usuario = await crearUsuario();
    usuario.iniciarConfiguracionDosFactores('SECRETO123');
    usuario.confirmarActivacionDosFactores(['hash1']);
    expect(() => usuario.iniciarConfiguracionDosFactores('OTRO-SECRETO')).toThrow('ya está activada');
  });

  it('desactivarDosFactores limpia secreto, flag y códigos de respaldo', async () => {
    const usuario = await crearUsuario();
    usuario.iniciarConfiguracionDosFactores('SECRETO123');
    usuario.confirmarActivacionDosFactores(['hash1']);
    usuario.desactivarDosFactores();
    expect(usuario.twoFactorEnabled).toBe(false);
    expect(usuario.twoFactorSecret).toBeNull();
    expect(usuario.twoFactorBackupCodes).toBeNull();
  });

  it('consumirCodigoRespaldo válido lo saca de la lista (un solo uso) y devuelve true', async () => {
    const usuario = await crearUsuario();
    usuario.iniciarConfiguracionDosFactores('SECRETO123');
    usuario.confirmarActivacionDosFactores(['hash1', 'hash2']);

    expect(usuario.consumirCodigoRespaldo('hash1')).toBe(true);
    expect(usuario.twoFactorBackupCodes).toEqual(['hash2']);
    // el mismo código no puede reusarse
    expect(usuario.consumirCodigoRespaldo('hash1')).toBe(false);
  });

  it('consumirCodigoRespaldo con un código que no existe devuelve false', async () => {
    const usuario = await crearUsuario();
    usuario.iniciarConfiguracionDosFactores('SECRETO123');
    usuario.confirmarActivacionDosFactores(['hash1']);
    expect(usuario.consumirCodigoRespaldo('no-existe')).toBe(false);
  });
});
