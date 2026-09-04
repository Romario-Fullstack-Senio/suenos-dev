import { Inject, Injectable } from '@nestjs/common';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../domain/refresh-token.repository.port';
import { RefreshToken } from '../domain/refresh-token.entity';

@Injectable()
export class ListarSesionesUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  /** Una fila por familyId (sesión), no por cada rotación individual del
   * refresh token — findActivasByUsuario ya solo trae válidos, y como cada
   * rotación revoca la anterior, en la práctica hay como mucho un token
   * válido por familyId; el `Map` es una red de seguridad por si dos
   * quedaran vivos a la vez por alguna carrera. */
  async execute(usuarioId: string): Promise<RefreshToken[]> {
    const activas = await this.refreshTokenRepo.findActivasByUsuario(usuarioId);
    const porFamilia = new Map<string, RefreshToken>();
    for (const token of activas) {
      const actual = porFamilia.get(token.familyId);
      if (!actual || token.createdAt > actual.createdAt) {
        porFamilia.set(token.familyId, token);
      }
    }
    return Array.from(porFamilia.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
