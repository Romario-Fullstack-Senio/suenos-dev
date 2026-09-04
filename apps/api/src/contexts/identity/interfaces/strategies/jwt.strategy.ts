import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
  purpose?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'dev-secret'),
    });
  }

  validate(payload: JwtPayload) {
    // El sessionToken (purpose: 'session-hint', ver LoginUseCase) es de vida
    // larga y solo existe para que el middleware de Next.js decida
    // server-side si deja pasar una navegación, y el tempToken de 2FA
    // (purpose: 'two-factor-pending', ver LoginUseCase/
    // ConfirmarLoginDosFactoresUseCase) solo prueba que ya se pasó la
    // contraseña pero falta el código TOTP — ninguno de los dos debe poder
    // usarse como bearer real contra la API, aunque tenga una firma válida.
    if (payload.purpose) {
      throw new UnauthorizedException('Token no válido para autenticación de API');
    }
    return { id: payload.sub, email: payload.email, rol: payload.rol };
  }
}
