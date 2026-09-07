import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComisionAfiliado, EstadoComision } from '../../domain/comision-afiliado.entity';
import { ComisionAfiliadoRepository } from '../../domain/comision-afiliado.repository.port';
import { ComisionAfiliadoOrmEntity } from './comision-afiliado.orm-entity';

@Injectable()
export class ComisionAfiliadoTypeOrmRepository implements ComisionAfiliadoRepository {
  constructor(
    @InjectRepository(ComisionAfiliadoOrmEntity)
    private readonly repo: Repository<ComisionAfiliadoOrmEntity>,
  ) {}

  async save(comision: ComisionAfiliado): Promise<void> {
    const orm = this.repo.create({
      id: comision.id,
      afiliadoId: comision.afiliadoId,
      referidoId: comision.referidoId,
      cursoId: comision.cursoId,
      cursoNombre: comision.cursoNombre,
      ordenId: comision.ordenId,
      monto: comision.monto,
      comisionMonto: comision.comisionMonto,
      estado: comision.estado,
    });
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<ComisionAfiliado | null> {
    const orm = await this.repo.findOne({ where: { id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByAfiliadoId(afiliadoId: string): Promise<ComisionAfiliado[]> {
    const orms = await this.repo.find({ where: { afiliadoId }, order: { createdAt: 'DESC' } });
    return orms.map((o) => this.toDomain(o));
  }

  async findAll(): Promise<ComisionAfiliado[]> {
    const orms = await this.repo.find({ order: { createdAt: 'DESC' } });
    return orms.map((o) => this.toDomain(o));
  }

  private toDomain(orm: ComisionAfiliadoOrmEntity): ComisionAfiliado {
    return ComisionAfiliado.reconstitute(orm.id, {
      afiliadoId: orm.afiliadoId,
      referidoId: orm.referidoId,
      cursoId: orm.cursoId,
      cursoNombre: orm.cursoNombre,
      ordenId: orm.ordenId,
      // `numeric` vuelve como string del driver de Postgres — mismo
      // criterio que OrdenTypeOrmRepository con item.precio.
      monto: Number(orm.monto),
      comisionMonto: Number(orm.comisionMonto),
      estado: orm.estado as EstadoComision,
      createdAt: orm.createdAt,
    });
  }
}
