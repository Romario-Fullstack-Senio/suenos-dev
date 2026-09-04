import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../domain/usuario.repository.port';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '../domain/refresh-token.repository.port';

@Injectable()
export class EliminarCuentaUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(usuarioId: string, passwordConfirmacion?: string): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundDomainError('Usuario no encontrado');

    // Las cuentas con password propio (no OAuth) tienen que reconfirmarla
    // antes de un borrado irreversible — evita que una sesión abierta en
    // una compu ajena baste para borrar la cuenta de otra persona.
    if (usuario.password) {
      if (!passwordConfirmacion || !(await usuario.verificarPassword(passwordConfirmacion))) {
        throw new UnauthorizedDomainError('Contraseña incorrecta');
      }
    }

    usuario.eliminarCuenta();
    await this.usuarioRepo.save(usuario);
    await this.refreshTokenRepo.revocarTodosDeUsuario(usuarioId);
  }
}
