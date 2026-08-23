import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('progreso_lecciones')
export class ProgresoLeccionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @Column({ name: 'leccion_id' })
  leccionId!: string;

  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Column({ type: 'float', default: 0 })
  porcentaje!: number;

  @Column({ type: 'boolean', default: false })
  completada!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
