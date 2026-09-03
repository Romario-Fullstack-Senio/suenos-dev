import { Inject, Injectable } from '@nestjs/common';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../domain/refresh-token.repository.port';
import { hashToken } from './token-hash.util';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(refreshTokenPlain: string): Promise<void> {
    const existente = await this.refreshTokenRepo.findByTokenHash(hashToken(refreshTokenPlain));
    if (existente) {
      existente.revocar();
      await this.refreshTokenRepo.save(existente);
    }
    // Si no se encuentra, no hay nada que revocar — logout es idempotente,
    // no es un error que el token ya no exista.
  }
}
