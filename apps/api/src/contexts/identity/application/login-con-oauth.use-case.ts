import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConflictDomainError } from '@suenos-dev/shared-kernel';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { AuthProviderTipo } from '../domain/auth-provider.value-object';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../domain/refresh-token.repository.port';
import { RefreshToken } from '../domain/refresh-token.entity';
import { EventBus } from '../../../common/event-bus';
import { hashToken } from './token-hash.util';
import { randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';

interface LoginConOAuthCommand {
  email: string;
  nombre: string;
  provider: AuthProviderTipo;
  providerId: string;
}

export interface LoginConOAuthResult {
  token: string;
  refreshToken: string;
  sessionToken: string;
  usuario: { id: string; nombre: string; email: string; rol: string; emailVerificado: boolean };
}

@Injectable()
export class LoginConOAuthUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LoginConOAuthCommand): Promise<LoginConOAuthResult> {
    const email = Email.create(command.email);

    let usuario = await this.usuarioRepo.findByEmail(email.value);

    if (usuario) {
      if (usuario.esOAuth && usuario.authProvider.value !== command.provider) {
        throw new ConflictDomainError('Este email está registrado con otro proveedor de autenticación');
      }
      if (!usuario.esOAuth) {
        usuario.vincularProveedor(command.provider, command.providerId);
        await this.usuarioRepo.save(usuario);
      }
    } else {
      const id = uuid();
      usuario = Usuario.registrarDesdeOAuth({
        id,
        nombre: command.nombre,
        email,
        provider: command.provider,
        providerId: command.providerId,
      });
      await this.usuarioRepo.save(usuario);
      for (const event of usuario.pullDomainEvents()) {
        await this.eventBus.publish(event);
      }
    }

    const payload = { sub: usuario.id, email: usuario.email.value, rol: usuario.rol.value };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });
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
