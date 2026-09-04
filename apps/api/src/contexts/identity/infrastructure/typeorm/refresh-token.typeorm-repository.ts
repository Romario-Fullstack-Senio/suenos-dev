import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository.port';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity';

@Injectable()
export class RefreshTokenTypeOrmRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async save(token: RefreshToken): Promise<void> {
    const orm = this.repo.create({
      id: token.id,
      usuarioId: token.usuarioId,
      tokenHash: token.tokenHash,
      familyId: token.familyId,
      userAgent: token.userAgent,
      expira: token.expira,
      revocado: token.revocado,
    });
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const orm = await this.repo.findOne({ where: { id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const orm = await this.repo.findOne({ where: { tokenHash } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findActivasByUsuario(usuarioId: string): Promise<RefreshToken[]> {
    const orms = await this.repo.find({
      where: { usuarioId, revocado: false, expira: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async revocarTodosDeUsuario(usuarioId: string): Promise<void> {
    await this.repo.update({ usuarioId }, { revocado: true });
  }

  private toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.reconstitute(
      orm.id,
      {
        usuarioId: orm.usuarioId,
        tokenHash: orm.tokenHash,
        // Filas de antes de que existiera familyId: cada una es su propia
        // "sesión" (fallback razonable — la migración ya backfillea esto,
        // pero el ?? queda como red de seguridad).
        familyId: orm.familyId ?? orm.id,
        userAgent: orm.userAgent,
        expira: orm.expira,
        revocado: orm.revocado,
      },
      orm.createdAt,
    );
  }
}
