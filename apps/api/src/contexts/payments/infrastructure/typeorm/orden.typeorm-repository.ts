import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Orden } from '../../domain/orden.entity';
import { OrdenRepository } from '../../domain/orden.repository.port';
import { OrdenOrmEntity } from './orden.orm-entity';
import { OrdenItemOrmEntity } from './orden-item.orm-entity';

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
      moneda: orden.moneda,
      stripeSessionId: orden.stripeSessionId,
      estado: orden.estado,
      items: orden.items.map((item) => {
        const itemOrm = new OrdenItemOrmEntity();
        itemOrm.id = item.id;
        itemOrm.ordenId = orden.id;
        itemOrm.cursoId = item.cursoId;
        itemOrm.cursoNombre = item.cursoNombre;
        itemOrm.precio = item.precio;
        return itemOrm;
      }),
    });
    await this.ormRepo.save(entity);
  }

  async findById(id: string): Promise<Orden | null> {
    const entity = await this.ormRepo.findOne({ where: { id }, relations: ['items'] });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByStripeSessionId(sessionId: string): Promise<Orden | null> {
    const entity = await this.ormRepo.findOne({ where: { stripeSessionId: sessionId }, relations: ['items'] });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByEstudianteId(estudianteId: string): Promise<Orden[]> {
    const entities = await this.ormRepo.find({ where: { estudianteId }, relations: ['items'], order: { createdAt: 'DESC' } });
    return entities.map(e => this.toDomain(e));
  }

  async findByCursoIds(cursoIds: string[]): Promise<Orden[]> {
    if (cursoIds.length === 0) return [];
    // Traemos las órdenes que tienen AL MENOS UN ítem entre los cursoIds
    // pedidos (típicamente los cursos de un instructor, para stats/analytics)
    // — pero con TODOS sus ítems cargados, no solo los que matchean, porque
    // orden.monto (el total) necesita la orden completa.
    const items = await this.ormRepo.manager.find(OrdenItemOrmEntity, { where: { cursoId: In(cursoIds) } });
    const ordenIds = [...new Set(items.map(i => i.ordenId))];
    if (ordenIds.length === 0) return [];
    const entities = await this.ormRepo.find({ where: { id: In(ordenIds) }, relations: ['items'] });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Orden[]> {
    const entities = await this.ormRepo.find({ relations: ['items'], order: { createdAt: 'DESC' } });
    return entities.map(e => this.toDomain(e));
  }

  private toDomain(entity: OrdenOrmEntity): Orden {
    return Orden.restore(
      entity.id,
      entity.estudianteId,
      (entity.items ?? []).map(i => ({
        id: i.id,
        cursoId: i.cursoId,
        cursoNombre: i.cursoNombre,
        // Mismo motivo que el viejo `monto`: pg devuelve `decimal` como
        // string para no perder precisión — sin este Number() cada suma/
        // .toFixed() downstream rompía (ver historial de este mismo bug
        // con Orden.monto antes de que existieran los ítems).
        precio: Number(i.precio),
      })),
      entity.moneda,
      entity.stripeSessionId,
      entity.estado as any,
      entity.createdAt,
    );
  }
}
