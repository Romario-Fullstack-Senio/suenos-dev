import { Entity, PrimaryColumn, Column, OneToMany, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RespuestaOrmEntity } from './respuesta.orm-entity';

// "leccion_preguntas", no "preguntas" — ese nombre ya lo usa el contexto
// assessment para las preguntas de quiz (assessment/domain/pregunta.entity.ts).
@Entity('leccion_preguntas')
export class PreguntaOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Index()
  @Column({ name: 'leccion_id' })
  leccionId!: string;

  @Column({ name: 'autor_id' })
  autorId!: string;

  @Column({ name: 'autor_nombre' })
  autorNombre!: string;

  @Column({ name: 'autor_es_instructor', default: false })
  autorEsInstructor!: boolean;

  @Column({ type: 'text' })
  texto!: string;

  @Column({ default: false })
  resuelta!: boolean;

  @OneToMany(() => RespuestaOrmEntity, (respuesta) => respuesta.pregunta, { cascade: true })
  respuestas!: RespuestaOrmEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
