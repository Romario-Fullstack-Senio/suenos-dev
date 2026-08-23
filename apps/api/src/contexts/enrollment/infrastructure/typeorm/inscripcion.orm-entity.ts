import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('inscripciones')
export class InscripcionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @Column({ name: 'curso_id' })
  cursoId!: string;

  @CreateDateColumn({ name: 'fecha_inscripcion' })
  fechaInscripcion!: Date;

  @Column({ default: true })
  activa!: boolean;
}
