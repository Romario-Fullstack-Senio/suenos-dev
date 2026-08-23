import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './interfaces/auth.controller';
import { UsuarioController } from './interfaces/usuario.controller';
import { RegistrarUsuarioUseCase } from './application/registrar-usuario.use-case';
import { LoginUseCase } from './application/login.use-case';
import { UsuarioTypeOrmRepository } from './infrastructure/typeorm/usuario.typeorm-repository';
import { UsuarioOrmEntity } from './infrastructure/typeorm/usuario.orm-entity';
import { USUARIO_REPOSITORY } from './domain/usuario.repository.port';
import { JwtStrategy } from './interfaces/strategies/jwt.strategy';

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
  controllers: [AuthController, UsuarioController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: UsuarioTypeOrmRepository },
    RegistrarUsuarioUseCase,
    LoginUseCase,
    JwtStrategy,
  ],
  exports: [JwtModule, USUARIO_REPOSITORY],
})
export class IdentityModule {}
