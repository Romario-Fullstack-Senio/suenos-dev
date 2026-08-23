import { Inject, Injectable } from '@nestjs/common';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { Password } from '../domain/password.value-object';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { v4 as uuid } from 'uuid';

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
  ) {}

  async execute(command: RegistrarUsuarioCommand): Promise<{ id: string }> {
    const existing = await this.usuarioRepo.findByEmail(command.email);
    if (existing) {
      throw new Error('Ya existe un usuario con ese email');
    }

    const id = uuid();
    const email = Email.create(command.email);
    const password = await Password.create(command.password);
    const usuario = Usuario.create(id, command.nombre, email, password);

    await this.usuarioRepo.save(usuario);

    return { id };
  }
}
