import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, EstadoTicket, CategoriaTicket } from '../../domain/ticket.entity';
import { MensajeTicket } from '../../domain/mensaje-ticket.entity';
import { TicketRepository } from '../../domain/ticket.repository.port';
import { TicketOrmEntity } from './ticket.orm-entity';
import { MensajeTicketOrmEntity } from './mensaje-ticket.orm-entity';

@Injectable()
export class TicketTypeOrmRepository implements TicketRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly repo: Repository<TicketOrmEntity>,
  ) {}

  async save(ticket: Ticket): Promise<void> {
    const orm = this.repo.create({
      id: ticket.id,
      usuarioId: ticket.usuarioId,
      usuarioNombre: ticket.usuarioNombre,
      asunto: ticket.asunto,
      categoria: ticket.categoria,
      estado: ticket.estado,
      mensajes: ticket.mensajes.map((m) => {
        const mOrm = new MensajeTicketOrmEntity();
        mOrm.id = m.id;
        mOrm.ticketId = ticket.id;
        mOrm.autorId = m.autorId;
        mOrm.autorNombre = m.autorNombre;
        mOrm.autorEsAdmin = m.autorEsAdmin;
        mOrm.texto = m.texto;
        return mOrm;
      }),
    });
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<Ticket | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ['mensajes'] });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByUsuarioId(usuarioId: string): Promise<Ticket[]> {
    const orms = await this.repo.find({
      where: { usuarioId },
      relations: ['mensajes'],
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async findAll(estado?: EstadoTicket): Promise<Ticket[]> {
    const orms = await this.repo.find({
      where: estado ? { estado } : {},
      relations: ['mensajes'],
      order: { updatedAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  private toDomain(orm: TicketOrmEntity): Ticket {
    const mensajes = (orm.mensajes ?? [])
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((m) =>
        MensajeTicket.reconstitute(m.id, {
          autorId: m.autorId,
          autorNombre: m.autorNombre,
          autorEsAdmin: m.autorEsAdmin,
          texto: m.texto,
          createdAt: m.createdAt,
        }),
      );

    return Ticket.reconstitute(orm.id, {
      usuarioId: orm.usuarioId,
      usuarioNombre: orm.usuarioNombre,
      asunto: orm.asunto,
      categoria: orm.categoria as CategoriaTicket,
      estado: orm.estado as EstadoTicket,
      mensajes,
      createdAt: orm.createdAt,
    });
  }
}
