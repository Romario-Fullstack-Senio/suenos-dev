import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../domain/refresh-token.repository.port';
import { RefreshToken } from '../domain/refresh-token.entity';
import { hashToken } from './token-hash.util';
import { randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';

export interface RefrescarTokenResult {
  token: string;
  refreshToken: string;
  sessionToken: string;
}

/** Rota el refresh token en cada uso (el anterior queda revocado): si un
 * refresh token robado se usa una vez, el legítimo deja de servir en el
 * siguiente intento — señal de que algo anda mal, en vez de dejar ambos
 * vigentes indefinidamente. */
@Injectable()
export class RefrescarTokenUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshTokenPlain: string): Promise<RefrescarTokenResult> {
    const existente = await this.refreshTokenRepo.findByTokenHash(hashToken(refreshTokenPlain));
    if (!existente || !existente.esValido) {
      throw new UnauthorizedException('Sesión expirada, iniciá sesión de nuevo');
    }

    const usuario = await this.usuarioRepo.findById(existente.usuarioId);
    if (!usuario) {
      throw new UnauthorizedException('Sesión expirada, iniciá sesión de nuevo');
    }

    existente.revocar();
    await this.refreshTokenRepo.save(existente);

    const payload = { sub: usuario.id, email: usuario.email.value, rol: usuario.rol.value };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const sessionToken = this.jwtService.sign({ ...payload, purpose: 'session-hint' }, { expiresIn: '30d' });

    const nuevoRefreshPlain = randomBytes(40).toString('hex');
    const nuevoRefresh = RefreshToken.crear(uuid(), usuario.id, hashToken(nuevoRefreshPlain));
    await this.refreshTokenRepo.save(nuevoRefresh);

    return { token, refreshToken: nuevoRefreshPlain, sessionToken };
  }
}
