import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('resenas')
@Index(['cursoId', 'estudianteId'], { unique: true })
export class ResenaOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Index()
  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @Column({ name: 'estudiante_nombre' })
  estudianteNombre!: string;

  @Column('int')
  calificacion!: number;

  @Column({ type: 'text', nullable: true })
  comentario!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
