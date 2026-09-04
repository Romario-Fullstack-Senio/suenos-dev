import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorito } from '../../domain/favorito.entity';
import { FavoritoRepository } from '../../domain/favorito.repository.port';
import { FavoritoOrmEntity } from './favorito.orm-entity';

@Injectable()
export class FavoritoTypeOrmRepository implements FavoritoRepository {
  constructor(
    @InjectRepository(FavoritoOrmEntity)
    private readonly repo: Repository<FavoritoOrmEntity>,
  ) {}

  async save(favorito: Favorito): Promise<void> {
    const orm = this.repo.create({
      id: favorito.id,
      usuarioId: favorito.usuarioId,
      cursoId: favorito.cursoId,
    });
    await this.repo.save(orm);
  }

  async findByUsuarioYCurso(usuarioId: string, cursoId: string): Promise<Favorito | null> {
    const orm = await this.repo.findOne({ where: { usuarioId, cursoId } });
    if (!orm) return null;
    return Favorito.reconstitute(orm.id, { usuarioId: orm.usuarioId, cursoId: orm.cursoId, createdAt: orm.createdAt });
  }

  async findByUsuario(usuarioId: string): Promise<Favorito[]> {
    const orms = await this.repo.find({ where: { usuarioId }, order: { createdAt: 'DESC' } });
    return orms.map(o => Favorito.reconstitute(o.id, { usuarioId: o.usuarioId, cursoId: o.cursoId, createdAt: o.createdAt }));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
