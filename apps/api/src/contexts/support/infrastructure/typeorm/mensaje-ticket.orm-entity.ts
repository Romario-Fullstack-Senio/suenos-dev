import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { TicketOrmEntity } from './ticket.orm-entity';

@Entity('ticket_mensajes')
export class MensajeTicketOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'ticket_id' })
  ticketId!: string;

  @ManyToOne(() => TicketOrmEntity, (ticket) => ticket.mensajes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: TicketOrmEntity;

  @Column({ name: 'autor_id' })
  autorId!: string;

  @Column({ name: 'autor_nombre' })
  autorNombre!: string;

  @Column({ name: 'autor_es_admin', default: false })
  autorEsAdmin!: boolean;

  @Column({ type: 'text' })
  texto!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
