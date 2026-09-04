import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { LoginUseCase, LoginResult } from './login.use-case';
import { hashToken } from './token-hash.util';

interface ConfirmarLoginDosFactoresCommand {
  tempToken: string;
  codigo: string;
}

@Injectable()
export class ConfirmarLoginDosFactoresUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly jwtService: JwtService,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async execute(command: ConfirmarLoginDosFactoresCommand): Promise<LoginResult> {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(command.tempToken);
    } catch {
      throw new UnauthorizedException('El código de sesión temporal venció — volvé a iniciar sesión');
    }
    if (payload.purpose !== 'two-factor-pending') {
      throw new UnauthorizedException('Token inválido');
    }

    const usuario = await this.usuarioRepo.findById(payload.sub);
    if (!usuario || !usuario.twoFactorEnabled || !usuario.twoFactorSecret) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const codigoLimpio = command.codigo.trim();
    const esValidoPorTotp = authenticator.verify({ token: codigoLimpio, secret: usuario.twoFactorSecret });

    if (!esValidoPorTotp) {
      // Fallback: códigos de respaldo (un solo uso) para cuando el usuario
      // perdió acceso a su app de autenticación.
      const consumido = usuario.consumirCodigoRespaldo(hashToken(codigoLimpio.toLowerCase()));
      if (!consumido) {
        throw new UnauthorizedException('Código incorrecto');
      }
      await this.usuarioRepo.save(usuario);
    }

    return this.loginUseCase.emitirTokens(usuario);
  }
}
