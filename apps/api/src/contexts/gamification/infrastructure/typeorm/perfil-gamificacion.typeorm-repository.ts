import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilGamificacion, PerfilGamificacionProps } from '../../domain/perfil-gamificacion.entity';
import { PerfilGamificacionRepository, RankingEntry } from '../../domain/perfil-gamificacion.repository.port';
import { InsigniaId } from '../../domain/insignias.catalog';
import { PerfilGamificacionOrmEntity } from './perfil-gamificacion.orm-entity';

@Injectable()
export class PerfilGamificacionTypeOrmRepository implements PerfilGamificacionRepository {
  constructor(
    @InjectRepository(PerfilGamificacionOrmEntity)
    private readonly repo: Repository<PerfilGamificacionOrmEntity>,
  ) {}

  async save(perfil: PerfilGamificacion): Promise<void> {
    const orm = this.repo.create({
      id: perfil.id,
      usuarioId: perfil.usuarioId,
      puntos: perfil.puntos,
      leccionesCompletadas: perfil.leccionesCompletadas,
      cursosComprados: perfil.cursosComprados,
      quizzesAprobados: perfil.quizzesAprobados,
      rachaActual: perfil.rachaActual,
      rachaMaxima: perfil.rachaMaxima,
      ultimaActividadFecha: perfil.ultimaActividadFecha,
      insigniasObtenidas: perfil.insigniasObtenidas,
    });
    await this.repo.save(orm);
  }

  async findByUsuarioId(usuarioId: string): Promise<PerfilGamificacion | null> {
    const orm = await this.repo.findOne({ where: { usuarioId } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async topPorPuntos(limite: number): Promise<RankingEntry[]> {
    const orms = await this.repo.find({ order: { puntos: 'DESC' }, take: limite });
    return orms.map((o) => ({ usuarioId: o.usuarioId, puntos: o.puntos }));
  }

  private toDomain(orm: PerfilGamificacionOrmEntity): PerfilGamificacion {
    const props: PerfilGamificacionProps = {
      usuarioId: orm.usuarioId,
      puntos: orm.puntos,
      leccionesCompletadas: orm.leccionesCompletadas,
      cursosComprados: orm.cursosComprados,
      quizzesAprobados: orm.quizzesAprobados,
      rachaActual: orm.rachaActual,
      rachaMaxima: orm.rachaMaxima,
      ultimaActividadFecha: orm.ultimaActividadFecha,
      insigniasObtenidas: (orm.insigniasObtenidas ?? []) as InsigniaId[],
    };
    return PerfilGamificacion.reconstitute(orm.id, props);
  }
}
