import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../domain/refresh-token.repository.port';

@Injectable()
export class RevocarSesionUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  /** `sesionId` es el id de la fila (el token vigente de esa familia) que
   * devuelve ListarSesionesUseCase — no el familyId. Revocar esa única fila
   * alcanza para matar la sesión: al rotar, cada refresh token nuevo
   * revoca al anterior, así que solo hay uno vigente por familia. */
  async execute(usuarioId: string, sesionId: string): Promise<void> {
    const sesion = await this.refreshTokenRepo.findById(sesionId);
    if (!sesion) {
      throw new NotFoundDomainError('Sesión no encontrada');
    }
    if (sesion.usuarioId !== usuarioId) {
      throw new UnauthorizedDomainError('No podés revocar la sesión de otro usuario');
    }
    sesion.revocar();
    await this.refreshTokenRepo.save(sesion);
  }
}
