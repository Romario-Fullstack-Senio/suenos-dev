import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './interfaces/auth.controller';
import { OAuthController } from './interfaces/oauth.controller';
import { UsuarioController } from './interfaces/usuario.controller';
import { RegistrarUsuarioUseCase } from './application/registrar-usuario.use-case';
import { LoginUseCase } from './application/login.use-case';
import { LoginConOAuthUseCase } from './application/login-con-oauth.use-case';
import { RefrescarTokenUseCase } from './application/refrescar-token.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { SolicitarResetPasswordUseCase } from './application/solicitar-reset-password.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { VerificarEmailUseCase } from './application/verificar-email.use-case';
import { ReenviarVerificacionUseCase } from './application/reenviar-verificacion.use-case';
import { Iniciar2FAUseCase } from './application/iniciar-2fa.use-case';
import { Confirmar2FAUseCase } from './application/confirmar-2fa.use-case';
import { Desactivar2FAUseCase } from './application/desactivar-2fa.use-case';
import { ConfirmarLoginDosFactoresUseCase } from './application/confirmar-login-2fa.use-case';
import { UsuarioTypeOrmRepository } from './infrastructure/typeorm/usuario.typeorm-repository';
import { UsuarioOrmEntity } from './infrastructure/typeorm/usuario.orm-entity';
import { RefreshTokenTypeOrmRepository } from './infrastructure/typeorm/refresh-token.typeorm-repository';
import { RefreshTokenOrmEntity } from './infrastructure/typeorm/refresh-token.orm-entity';
import { USUARIO_REPOSITORY } from './domain/usuario.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from './domain/refresh-token.repository.port';
import { JwtStrategy } from './interfaces/strategies/jwt.strategy';
import { GoogleStrategy } from './infrastructure/passport/google.strategy';
import { GithubStrategy } from './infrastructure/passport/github.strategy';

const googleStrategyProvider = {
  provide: GoogleStrategy,
  useFactory: (config: ConfigService) => {
    const clientId = config.get('GOOGLE_CLIENT_ID');
    const clientSecret = config.get('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return null;
    }
    return new GoogleStrategy(config);
  },
  inject: [ConfigService],
};

const githubStrategyProvider = {
  provide: GithubStrategy,
  useFactory: (config: ConfigService) => {
    const clientId = config.get('GITHUB_CLIENT_ID');
    const clientSecret = config.get('GITHUB_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return null;
    }
    return new GithubStrategy(config);
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioOrmEntity, RefreshTokenOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret'),
        // Default para JwtStrategy (valida tokens ya emitidos, expiresIn:
        // '15m' explícito en LoginUseCase/RefrescarTokenUseCase es el que
        // realmente manda al firmar). '7d' acá es solo un fallback razonable.
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController, OAuthController, UsuarioController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: UsuarioTypeOrmRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenTypeOrmRepository },
    RegistrarUsuarioUseCase,
    LoginUseCase,
    LoginConOAuthUseCase,
    RefrescarTokenUseCase,
    LogoutUseCase,
    SolicitarResetPasswordUseCase,
    ResetPasswordUseCase,
    VerificarEmailUseCase,
    ReenviarVerificacionUseCase,
    Iniciar2FAUseCase,
    Confirmar2FAUseCase,
    Desactivar2FAUseCase,
    ConfirmarLoginDosFactoresUseCase,
    JwtStrategy,
    googleStrategyProvider,
    githubStrategyProvider,
  ],
  exports: [JwtModule, USUARIO_REPOSITORY],
})
export class IdentityModule {}
