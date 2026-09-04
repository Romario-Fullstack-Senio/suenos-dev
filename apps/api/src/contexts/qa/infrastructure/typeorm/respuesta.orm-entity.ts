import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { PreguntaOrmEntity } from './pregunta.orm-entity';

@Entity('leccion_pregunta_respuestas')
export class RespuestaOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'pregunta_id' })
  preguntaId!: string;

  @ManyToOne(() => PreguntaOrmEntity, (pregunta) => pregunta.respuestas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregunta_id' })
  pregunta?: PreguntaOrmEntity;

  @Column({ name: 'autor_id' })
  autorId!: string;

  @Column({ name: 'autor_nombre' })
  autorNombre!: string;

  @Column({ name: 'autor_es_instructor', default: false })
  autorEsInstructor!: boolean;

  @Column({ type: 'text' })
  texto!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
