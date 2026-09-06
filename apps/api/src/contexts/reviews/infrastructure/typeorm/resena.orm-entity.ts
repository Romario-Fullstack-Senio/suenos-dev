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

  // IDs de usuarios que reportaron esta reseña — no un contador simple,
  // para que un mismo usuario no pueda inflarlo reportando varias veces.
  // Nullable (no default JSON) porque simple-json no acepta un default de
  // columna simple entre motores — null se trata como "sin reportes" al
  // reconstituir el dominio, igual que two_factor_backup_codes.
  @Column({ name: 'reportado_por', type: 'simple-json', nullable: true })
  reportadoPor!: string[] | null;

  @Column({ default: false })
  oculta!: boolean;
}
