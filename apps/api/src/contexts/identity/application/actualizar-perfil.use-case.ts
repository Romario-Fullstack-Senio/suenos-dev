import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, ConflictDomainError } from '@suenos-dev/shared-kernel';
import { randomBytes } from 'crypto';
import { Email } from '../domain/email.value-object';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { EventBus } from '../../../common/event-bus';

export interface ActualizarPerfilCommand {
  usuarioId: string;
  nombre: string;
  email: string;
}

@Injectable()
export class ActualizarPerfilUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ActualizarPerfilCommand): Promise<void> {
    const usuario = await this.usuarioRepo.findById(command.usuarioId);
    if (!usuario) {
      throw new NotFoundDomainError('Usuario no encontrado');
    }

    const email = Email.create(command.email);

    if (email.value !== usuario.email.value) {
      const existente = await this.usuarioRepo.findByEmail(email.value);
      if (existente && existente.id !== usuario.id) {
        throw new ConflictDomainError('Ya existe un usuario con ese email');
      }
    }

    // Si el email cambió, Usuario.actualizarPerfil des-verifica la cuenta y
    // dispara un nuevo correo de verificación con este token — mismo
    // criterio que el registro inicial.
    const nuevoToken = randomBytes(32).toString('hex');
    usuario.actualizarPerfil(command.nombre, email, nuevoToken);
    await this.usuarioRepo.save(usuario);

    for (const event of usuario.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
