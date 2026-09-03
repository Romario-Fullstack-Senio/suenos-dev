import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notificaciones')
export class NotificacionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @Column()
  titulo!: string;

  @Column({ type: 'text' })
  mensaje!: string;

  @Column({ default: 'curso_publicado' })
  tipo!: string;

  @Column({ name: 'curso_id', type: 'uuid', nullable: true })
  cursoId!: string | null;

  @Column({ default: false })
  leida!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
