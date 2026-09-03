import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      expira: token.expira,
      revocado: token.revocado,
    });
    await this.repo.save(orm);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const orm = await this.repo.findOne({ where: { tokenHash } });
    if (!orm) return null;
    return RefreshToken.reconstitute(orm.id, {
      usuarioId: orm.usuarioId,
      tokenHash: orm.tokenHash,
      expira: orm.expira,
      revocado: orm.revocado,
    });
  }

  async revocarTodosDeUsuario(usuarioId: string): Promise<void> {
    await this.repo.update({ usuarioId }, { revocado: true });
  }
}
