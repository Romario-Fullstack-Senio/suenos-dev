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
    });
    await this.repo.save(orm);
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
    return Usuario.reconstitute(
      orm.id,
      orm.nombre,
      Email.create(orm.email),
      orm.password_hash ? Password.fromHash(orm.password_hash) : null,
      Rol.from(orm.rol),
      orm.created_at,
      AuthProvider.from(orm.auth_provider),
      orm.provider_id,
    );
  }
}
