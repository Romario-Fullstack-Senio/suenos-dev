import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Orden } from '../../domain/orden.entity';
import { OrdenRepository } from '../../domain/orden.repository.port';
import { OrdenOrmEntity } from './orden.orm-entity';

@Injectable()
export class OrdenTypeOrmRepository implements OrdenRepository {
  constructor(
    @InjectRepository(OrdenOrmEntity)
    private readonly ormRepo: Repository<OrdenOrmEntity>,
  ) {}

  async save(orden: Orden): Promise<void> {
    const entity = this.ormRepo.create({
      id: orden.id,
      estudianteId: orden.estudianteId,
      cursoId: orden.cursoId,
      monto: orden.monto,
      moneda: orden.moneda,
      stripeSessionId: orden.stripeSessionId,
      estado: orden.estado,
    });
    await this.ormRepo.save(entity);
  }

  async findById(id: string): Promise<Orden | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByStripeSessionId(sessionId: string): Promise<Orden | null> {
    const entity = await this.ormRepo.findOne({ where: { stripeSessionId: sessionId } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByEstudianteId(estudianteId: string): Promise<Orden[]> {
    const entities = await this.ormRepo.find({ where: { estudianteId }, order: { createdAt: 'DESC' } });
    return entities.map(e => this.toDomain(e));
  }

  async findByCursoIds(cursoIds: string[]): Promise<Orden[]> {
    if (cursoIds.length === 0) return [];
    const entities = await this.ormRepo.find({ where: { cursoId: In(cursoIds) } });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Orden[]> {
    const entities = await this.ormRepo.find({ order: { createdAt: 'DESC' } });
    return entities.map(e => this.toDomain(e));
  }

  private toDomain(entity: OrdenOrmEntity): Orden {
    return Orden.restore(
      entity.id,
      entity.estudianteId,
      entity.cursoId,
      // El driver de pg devuelve las columnas `numeric`/`decimal` como
      // string (para no perder precisión) — sin este Number(), orden.monto
      // rompía cualquier operación aritmética o .toFixed() downstream
      // (encontrado generando el PDF de factura).
      Number(entity.monto),
      entity.moneda,
      entity.stripeSessionId,
      entity.estado as any,
      entity.createdAt,
    );
  }
}
