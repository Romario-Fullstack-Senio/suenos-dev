import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../domain/usuario.entity';
import { UsuarioRepository } from '../../domain/usuario.repository.port';
import { Email } from '../../domain/email.value-object';
import { Password } from '../../domain/password.value-object';
import { Rol } from '../../domain/rol.value-object';
import { AuthProvider, AuthProviderTipo } from '../../domain/auth-provider.value-object';
import { UsuarioOrmEntity } from './usuario.orm-entity';

@Injectable()
export class UsuarioTypeOrmRepository implements UsuarioRepository {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly repo: Repository<UsuarioOrmEntity>,
  ) {}

  async save(usuario: Usuario): Promise<void> {
    const orm = this.repo.create({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email.value,
      password_hash: usuario.password?.hash ?? null,
      rol: usuario.rol.value,
      auth_provider: usuario.authProvider.value,
      provider_id: usuario.providerId,
      email_verificado: usuario.emailVerificado,
      verificacion_token: usuario.verificacionToken,
      verificacion_token_expira: usuario.verificacionTokenExpira,
      reset_password_token: usuario.resetPasswordToken,
      reset_password_expira: usuario.resetPasswordExpira,
      two_factor_secret: usuario.twoFactorSecret,
      two_factor_enabled: usuario.twoFactorEnabled,
      two_factor_backup_codes: usuario.twoFactorBackupCodes,
      avatar_url: usuario.avatarUrl,
      cuenta_eliminada: usuario.cuentaEliminada,
    });
    await this.repo.save(orm);
  }

  async findByVerificacionToken(token: string): Promise<Usuario | null> {
    const orm = await this.repo.findOne({ where: { verificacion_token: token } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByResetPasswordToken(token: string): Promise<Usuario | null> {
    const orm = await this.repo.findOne({ where: { reset_password_token: token } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const orm = await this.repo.findOne({ where: { email } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findById(id: string): Promise<Usuario | null> {
    const orm = await this.repo.findOne({ where: { id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByProvider(provider: AuthProviderTipo, providerId: string): Promise<Usuario | null> {
    const orm = await this.repo.findOne({ where: { auth_provider: provider, provider_id: providerId } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findAll(): Promise<Usuario[]> {
    const orms = await this.repo.find();
    return orms.map(orm => this.toDomain(orm));
  }

  private toDomain(orm: UsuarioOrmEntity): Usuario {
    return Usuario.reconstitute(orm.id, {
      nombre: orm.nombre,
      email: Email.create(orm.email),
      password: orm.password_hash ? Password.fromHash(orm.password_hash) : null,
      rol: Rol.from(orm.rol),
      createdAt: orm.created_at,
      authProvider: AuthProvider.from(orm.auth_provider),
      providerId: orm.provider_id,
      emailVerificado: orm.email_verificado,
      verificacionToken: orm.verificacion_token,
      verificacionTokenExpira: orm.verificacion_token_expira,
      resetPasswordToken: orm.reset_password_token,
      resetPasswordExpira: orm.reset_password_expira,
      twoFactorSecret: orm.two_factor_secret,
      twoFactorEnabled: orm.two_factor_enabled,
      twoFactorBackupCodes: orm.two_factor_backup_codes,
      avatarUrl: orm.avatar_url,
      cuentaEliminada: orm.cuenta_eliminada,
    });
  }
}
