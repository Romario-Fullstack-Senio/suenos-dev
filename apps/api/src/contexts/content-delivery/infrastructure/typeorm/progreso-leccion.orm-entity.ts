import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('progreso_lecciones')
export class ProgresoLeccionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @Index()
  @Column({ name: 'leccion_id' })
  leccionId!: string;

  @Index()
  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Column({ type: 'float', default: 0 })
  porcentaje!: number;

  @Column({ type: 'boolean', default: false })
  completada!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
