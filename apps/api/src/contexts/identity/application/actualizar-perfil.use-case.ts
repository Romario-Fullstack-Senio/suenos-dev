import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, ConflictDomainError } from '@suenos-dev/shared-kernel';
import { Email } from '../domain/email.value-object';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';

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

    usuario.actualizarPerfil(command.nombre, email);
    await this.usuarioRepo.save(usuario);
  }
}
