import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paquete } from '../../domain/paquete.entity';
import { PaqueteRepository } from '../../domain/paquete.repository.port';
import { PaqueteOrmEntity } from './paquete.orm-entity';

@Injectable()
export class PaqueteTypeOrmRepository implements PaqueteRepository {
  constructor(
    @InjectRepository(PaqueteOrmEntity)
    private readonly repo: Repository<PaqueteOrmEntity>,
  ) {}

  async save(paquete: Paquete): Promise<void> {
    const orm = this.repo.create({
      id: paquete.id,
      titulo: paquete.titulo,
      descripcion: paquete.descripcion,
      cursoIds: paquete.cursoIds,
      descuentoPorcentaje: paquete.descuentoPorcentaje,
      activo: paquete.activo,
    });
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<Paquete | null> {
    const orm = await this.repo.findOne({ where: { id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findAll(soloActivos?: boolean): Promise<Paquete[]> {
    const orms = await this.repo.find({
      where: soloActivos ? { activo: true } : {},
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(orm: PaqueteOrmEntity): Paquete {
    return Paquete.reconstitute(orm.id, {
      titulo: orm.titulo,
      descripcion: orm.descripcion,
      cursoIds: orm.cursoIds,
      descuentoPorcentaje: orm.descuentoPorcentaje,
      activo: orm.activo,
      createdAt: orm.createdAt,
    });
  }
}
