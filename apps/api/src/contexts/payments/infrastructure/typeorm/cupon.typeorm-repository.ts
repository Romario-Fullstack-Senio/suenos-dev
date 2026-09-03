import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cupon, TipoCupon } from '../../domain/cupon.entity';
import { CuponRepository } from '../../domain/cupon.repository.port';
import { CuponOrmEntity } from './cupon.orm-entity';

@Injectable()
export class CuponTypeOrmRepository implements CuponRepository {
  constructor(
    @InjectRepository(CuponOrmEntity)
    private readonly repo: Repository<CuponOrmEntity>,
  ) {}

  async save(cupon: Cupon): Promise<void> {
    const orm = this.repo.create({
      id: cupon.id,
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: cupon.valor,
      activo: cupon.activo,
      cursoId: cupon.cursoId ?? null,
      fechaExpiracion: cupon.fechaExpiracion ?? null,
      usosMaximos: cupon.usosMaximos ?? null,
      usosActuales: cupon.usosActuales,
    });
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<Cupon | null> {
    const orm = await this.repo.findOne({ where: { id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByCodigo(codigo: string): Promise<Cupon | null> {
    const orm = await this.repo.findOne({ where: { codigo: codigo.trim().toUpperCase() } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findAll(): Promise<Cupon[]> {
    const orms = await this.repo.find({ order: { createdAt: 'DESC' } });
    return orms.map(o => this.toDomain(o));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(orm: CuponOrmEntity): Cupon {
    return Cupon.reconstitute(orm.id, {
      codigo: orm.codigo,
      tipo: orm.tipo as TipoCupon,
      valor: Number(orm.valor),
      activo: orm.activo,
      cursoId: orm.cursoId ?? undefined,
      fechaExpiracion: orm.fechaExpiracion ?? undefined,
      usosMaximos: orm.usosMaximos ?? undefined,
      usosActuales: orm.usosActuales,
    });
  }
}
