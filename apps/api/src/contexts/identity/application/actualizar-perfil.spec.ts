import { ActualizarPerfilUseCase } from './actualizar-perfil.use-case';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { Password } from '../domain/password.value-object';
import { Rol } from '../domain/rol.value-object';

async function crearUsuario(id: string, email: string) {
  const password = await Password.create('password123');
  return Usuario.create(id, 'Ana', Email.create(email), password);
}

describe('ActualizarPerfilUseCase', () => {
  let useCase: ActualizarPerfilUseCase;
  let mockUsuarioRepo: { findById: jest.Mock; findByEmail: jest.Mock; save: jest.Mock };
  let mockEventBus: { publish: jest.Mock };

  beforeEach(() => {
    mockUsuarioRepo = { findById: jest.fn(), findByEmail: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    useCase = new ActualizarPerfilUseCase(mockUsuarioRepo as any, mockEventBus as any);
  });

  it('actualiza nombre y email cuando no hay conflicto', async () => {
    const usuario = await crearUsuario('u1', 'ana@test.com');
    mockUsuarioRepo.findById.mockResolvedValue(usuario);
    mockUsuarioRepo.findByEmail.mockResolvedValue(null);

    await useCase.execute({ usuarioId: 'u1', nombre: 'Ana María', email: 'nueva@test.com' });

    expect(usuario.nombre).toBe('Ana María');
    expect(usuario.email.value).toBe('nueva@test.com');
    expect(mockUsuarioRepo.save).toHaveBeenCalledWith(usuario);
  });

  it('no consulta findByEmail si el email no cambió', async () => {
    const usuario = await crearUsuario('u1', 'ana@test.com');
    mockUsuarioRepo.findById.mockResolvedValue(usuario);

    await useCase.execute({ usuarioId: 'u1', nombre: 'Ana María', email: 'ana@test.com' });

    expect(mockUsuarioRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('rechaza el cambio si el email ya lo usa otra cuenta', async () => {
    const usuario = await crearUsuario('u1', 'ana@test.com');
    const otro = await crearUsuario('u2', 'ocupado@test.com');
    mockUsuarioRepo.findById.mockResolvedValue(usuario);
    mockUsuarioRepo.findByEmail.mockResolvedValue(otro);

    await expect(
      useCase.execute({ usuarioId: 'u1', nombre: 'Ana', email: 'ocupado@test.com' }),
    ).rejects.toThrow('Ya existe un usuario con ese email');
    expect(mockUsuarioRepo.save).not.toHaveBeenCalled();
  });

  it('un email con distinto casing que normaliza al mismo valor no cuenta como cambio', async () => {
    const usuario = await crearUsuario('u1', 'ana@test.com');
    mockUsuarioRepo.findById.mockResolvedValue(usuario);

    await useCase.execute({ usuarioId: 'u1', nombre: 'Ana', email: 'ANA@TEST.COM' });

    expect(mockUsuarioRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('cambiar el email des-verifica la cuenta y publica un evento para reenviar la verificación', async () => {
    const password = await Password.create('password123');
    const usuario = Usuario.reconstitute('u1', {
      nombre: 'Ana',
      email: Email.create('ana@test.com'),
      password,
      rol: Rol.estudiante(),
      createdAt: new Date(),
      emailVerificado: true, // arranca YA verificada
    });
    mockUsuarioRepo.findById.mockResolvedValue(usuario);
    mockUsuarioRepo.findByEmail.mockResolvedValue(null);

    await useCase.execute({ usuarioId: 'u1', nombre: 'Ana', email: 'nueva@test.com' });

    expect(usuario.emailVerificado).toBe(false);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const evento = mockEventBus.publish.mock.calls[0][0];
    expect(evento.eventName).toBe('usuario.email-actualizado');
    expect(evento.email).toBe('nueva@test.com');
  });

  it('no toca emailVerificado ni publica eventos si el email no cambió', async () => {
    const password = await Password.create('password123');
    const usuario = Usuario.reconstitute('u1', {
      nombre: 'Ana',
      email: Email.create('ana@test.com'),
      password,
      rol: Rol.estudiante(),
      createdAt: new Date(),
      emailVerificado: true,
    });
    mockUsuarioRepo.findById.mockResolvedValue(usuario);

    await useCase.execute({ usuarioId: 'u1', nombre: 'Ana María', email: 'ana@test.com' });

    expect(usuario.emailVerificado).toBe(true);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('lanza NotFoundDomainError si el usuario no existe', async () => {
    mockUsuarioRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ usuarioId: 'no-existe', nombre: 'Ana', email: 'ana@test.com' }),
    ).rejects.toThrow('Usuario no encontrado');
  });
});
