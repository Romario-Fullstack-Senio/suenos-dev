import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('certificados')
export class CertificadoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @Index()
  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Column({ name: 'estudiante_nombre' })
  estudianteNombre!: string;

  @Column({ name: 'curso_nombre' })
  cursoNombre!: string;

  @CreateDateColumn({ name: 'fecha_emision' })
  fechaEmision!: Date;

  @Column({ name: 'codigo_verificacion' })
  codigoVerificacion!: string;
}
