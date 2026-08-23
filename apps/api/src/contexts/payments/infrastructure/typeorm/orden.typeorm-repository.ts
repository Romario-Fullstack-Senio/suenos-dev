import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  private toDomain(entity: OrdenOrmEntity): Orden {
    return Orden.restore(
      entity.id,
      entity.estudianteId,
      entity.cursoId,
      entity.monto,
      entity.moneda,
      entity.stripeSessionId,
      entity.estado as any,
    );
  }
}
