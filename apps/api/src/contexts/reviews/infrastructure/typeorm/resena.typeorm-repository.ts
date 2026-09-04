import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resena } from '../../domain/resena.entity';
import { ResenaRepository, ResumenResenas } from '../../domain/resena.repository.port';
import { ResenaOrmEntity } from './resena.orm-entity';

@Injectable()
export class ResenaTypeOrmRepository implements ResenaRepository {
  constructor(
    @InjectRepository(ResenaOrmEntity)
    private readonly repo: Repository<ResenaOrmEntity>,
  ) {}

  async save(resena: Resena): Promise<void> {
    const orm = this.repo.create({
      id: resena.id,
      cursoId: resena.cursoId,
      estudianteId: resena.estudianteId,
      estudianteNombre: resena.estudianteNombre,
      calificacion: resena.calificacion,
      comentario: resena.comentario,
    });
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<Resena | null> {
    const orm = await this.repo.findOne({ where: { id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByCursoYEstudiante(cursoId: string, estudianteId: string): Promise<Resena | null> {
    const orm = await this.repo.findOne({ where: { cursoId, estudianteId } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByCursoId(cursoId: string): Promise<Resena[]> {
    const orms = await this.repo.find({ where: { cursoId }, order: { createdAt: 'DESC' } });
    return orms.map(o => this.toDomain(o));
  }

  async findAll(): Promise<Resena[]> {
    const orms = await this.repo.find({ order: { createdAt: 'DESC' } });
    return orms.map(o => this.toDomain(o));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async resumenPorCursos(cursoIds: string[]): Promise<ResumenResenas[]> {
    if (cursoIds.length === 0) return [];
    const rows = await this.repo
      .createQueryBuilder('resena')
      .select('resena.curso_id', 'cursoId')
      .addSelect('AVG(resena.calificacion)', 'promedio')
      .addSelect('COUNT(*)', 'total')
      .where('resena.curso_id IN (:...cursoIds)', { cursoIds })
      .groupBy('resena.curso_id')
      .getRawMany();

    return rows.map(r => ({
      cursoId: r.cursoId,
      promedio: Math.round(Number(r.promedio) * 10) / 10,
      total: Number(r.total),
    }));
  }

  private toDomain(orm: ResenaOrmEntity): Resena {
    return Resena.reconstitute(orm.id, {
      cursoId: orm.cursoId,
      estudianteId: orm.estudianteId,
      estudianteNombre: orm.estudianteNombre,
      calificacion: orm.calificacion,
      comentario: orm.comentario,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}
