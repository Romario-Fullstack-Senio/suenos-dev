import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';

@Injectable()
export class Desactivar2FAUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  /** Exige la contraseña actual — no alcanza con estar logueado (el access
   * token puede seguir vivo aunque alguien le haya robado la sesión del
   * navegador; la contraseña es la prueba de que es el dueño real). */
  async execute(usuarioId: string, passwordActual: string): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundDomainError('Usuario no encontrado');

    const valida = await usuario.verificarPassword(passwordActual);
    if (!valida) {
      throw new UnauthorizedDomainError('Contraseña incorrecta');
    }

    usuario.desactivarDosFactores();
    await this.usuarioRepo.save(usuario);
  }
}
