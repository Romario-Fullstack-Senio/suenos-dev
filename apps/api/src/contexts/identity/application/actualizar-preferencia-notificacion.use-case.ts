import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../domain/usuario.repository.port';

@Injectable()
export class ActualizarPreferenciaNotificacionUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(usuarioId: string, notificarCursoNuevo: boolean): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundDomainError('Usuario no encontrado');
    usuario.actualizarPreferenciaCursoNuevo(notificarCursoNuevo);
    await this.usuarioRepo.save(usuario);
  }
}
