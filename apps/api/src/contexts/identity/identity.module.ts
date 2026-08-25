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
import { UsuarioTypeOrmRepository } from './infrastructure/typeorm/usuario.typeorm-repository';
import { UsuarioOrmEntity } from './infrastructure/typeorm/usuario.orm-entity';
import { USUARIO_REPOSITORY } from './domain/usuario.repository.port';
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
    TypeOrmModule.forFeature([UsuarioOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController, OAuthController, UsuarioController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: UsuarioTypeOrmRepository },
    RegistrarUsuarioUseCase,
    LoginUseCase,
    LoginConOAuthUseCase,
    JwtStrategy,
    googleStrategyProvider,
    githubStrategyProvider,
  ],
  exports: [JwtModule, USUARIO_REPOSITORY],
})
export class IdentityModule {}
