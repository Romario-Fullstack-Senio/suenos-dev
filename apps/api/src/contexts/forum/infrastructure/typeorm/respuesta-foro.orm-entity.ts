import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { TemaForoOrmEntity } from './tema-foro.orm-entity';

@Entity('foro_respuestas')
export class RespuestaForoOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'tema_id' })
  temaId!: string;

  @ManyToOne(() => TemaForoOrmEntity, (tema) => tema.respuestas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tema_id' })
  tema?: TemaForoOrmEntity;

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
