import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from '../../domain/notificacion.entity';
import { NotificacionRepository } from '../../domain/notificacion.repository.port';
import { NotificacionOrmEntity } from './notificacion.orm-entity';

@Injectable()
export class NotificacionTypeOrmRepository implements NotificacionRepository {
  constructor(
    @InjectRepository(NotificacionOrmEntity)
    private readonly ormRepo: Repository<NotificacionOrmEntity>,
  ) {}

  async save(notificacion: Notificacion): Promise<void> {
    const orm = this.ormRepo.create({
      id: notificacion.id,
      usuarioId: notificacion.usuarioId,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      tipo: notificacion.tipo,
      cursoId: notificacion.cursoId,
      leida: notificacion.leida,
    });
    await this.ormRepo.save(orm);
  }

  async findByUsuario(usuarioId: string, limit = 20): Promise<Notificacion[]> {
    const entities = await this.ormRepo.find({
      where: { usuarioId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async countNoLeidas(usuarioId: string): Promise<number> {
    return this.ormRepo.count({
      where: { usuarioId, leida: false },
    });
  }

  async marcarComoLeida(id: string): Promise<void> {
    await this.ormRepo.update(id, { leida: true });
  }

  async marcarTodasLeidas(usuarioId: string): Promise<void> {
    await this.ormRepo.update(
      { usuarioId, leida: false },
      { leida: true },
    );
  }

  private toDomain(entity: NotificacionOrmEntity): Notificacion {
    return Notificacion.reconstitute(entity.id, {
      usuarioId: entity.usuarioId,
      titulo: entity.titulo,
      mensaje: entity.mensaje,
      tipo: entity.tipo,
      cursoId: entity.cursoId,
      leida: entity.leida,
      createdAt: entity.createdAt,
    });
  }
}
