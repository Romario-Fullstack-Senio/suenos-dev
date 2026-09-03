import { Inject, Injectable } from '@nestjs/common';
import { ConflictDomainError } from '@suenos-dev/shared-kernel';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { Password } from '../domain/password.value-object';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { EventBus } from '../../../common/event-bus';
import { v4 as uuid } from 'uuid';
import { randomBytes } from 'crypto';

interface RegistrarUsuarioCommand {
  nombre: string;
  email: string;
  password: string;
}

@Injectable()
export class RegistrarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegistrarUsuarioCommand): Promise<{ id: string }> {
    const existing = await this.usuarioRepo.findByEmail(command.email);
    if (existing) {
      throw new ConflictDomainError('Ya existe un usuario con ese email');
    }

    const id = uuid();
    const email = Email.create(command.email);
    const password = await Password.create(command.password);
    const verificacionToken = randomBytes(32).toString('hex');
    const usuario = Usuario.create(id, command.nombre, email, password, undefined, verificacionToken);

    await this.usuarioRepo.save(usuario);

    for (const event of usuario.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }

    return { id };
  }
}
