import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../domain/refresh-token.repository.port';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(token: string, nuevaPassword: string): Promise<void> {
    const usuario = await this.usuarioRepo.findByResetPasswordToken(token);
    if (!usuario) {
      throw new NotFoundDomainError('El enlace de recuperación no es válido');
    }
    await usuario.resetearPassword(token, nuevaPassword);
    await this.usuarioRepo.save(usuario);

    // Si la cuenta fue comprometida (motivo típico de un reset), cualquier
    // sesión activa con el refresh token viejo debe cortarse acá.
    await this.refreshTokenRepo.revocarTodosDeUsuario(usuario.id);
  }
}
