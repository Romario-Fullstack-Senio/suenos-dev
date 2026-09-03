import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../domain/refresh-token.repository.port';
import { RefreshToken } from '../domain/refresh-token.entity';
import { hashToken } from './token-hash.util';
import { randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';

interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  sessionToken: string;
  usuario: { id: string; nombre: string; email: string; rol: string; emailVerificado: boolean };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const usuario = await this.usuarioRepo.findByEmail(command.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await usuario.verificarPassword(command.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: usuario.id, email: usuario.email.value, rol: usuario.rol.value };
    // Access token de vida corta — el refresh token es el que sostiene la
    // sesión larga y puede revocarse server-side sin tocar el JWT en sí.
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });
    // sessionToken: JWT de vida larga (misma ventana que el refresh token),
    // NUNCA aceptado como bearer real por la API — solo lo lee el middleware
    // de Next.js (en una cookie no-httpOnly) para decidir server-side si
    // deja pasar la navegación a una ruta protegida. La autorización real
    // sigue siendo 100% el `token` de arriba vía JwtAuthGuard.
    const sessionToken = this.jwtService.sign({ ...payload, purpose: 'session-hint' }, { expiresIn: '30d' });

    const refreshTokenPlain = randomBytes(40).toString('hex');
    const refreshToken = RefreshToken.crear(uuid(), usuario.id, hashToken(refreshTokenPlain));
    await this.refreshTokenRepo.save(refreshToken);

    return {
      token,
      refreshToken: refreshTokenPlain,
      sessionToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email.value,
        rol: usuario.rol.value,
        emailVerificado: usuario.emailVerificado,
      },
    };
  }
}
