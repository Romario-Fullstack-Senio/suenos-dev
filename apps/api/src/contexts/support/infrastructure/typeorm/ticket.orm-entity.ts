import { Entity, PrimaryColumn, Column, OneToMany, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MensajeTicketOrmEntity } from './mensaje-ticket.orm-entity';

@Entity('tickets')
export class TicketOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @Column({ name: 'usuario_nombre' })
  usuarioNombre!: string;

  @Column()
  asunto!: string;

  @Column({ default: 'otro' })
  categoria!: string;

  @Index()
  @Column({ default: 'abierto' })
  estado!: string;

  @OneToMany(() => MensajeTicketOrmEntity, (mensaje) => mensaje.ticket, { cascade: true })
  mensajes!: MensajeTicketOrmEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
