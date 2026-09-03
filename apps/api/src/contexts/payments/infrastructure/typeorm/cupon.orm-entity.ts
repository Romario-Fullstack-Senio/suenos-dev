import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('cupones')
export class CuponOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column()
  codigo!: string;

  @Column()
  tipo!: string;

  @Column('decimal')
  valor!: number;

  @Column({ default: true })
  activo!: boolean;

  @Index()
  @Column({ type: 'varchar', name: 'curso_id', nullable: true })
  cursoId!: string | null;

  @Column({ name: 'fecha_expiracion', type: 'timestamp', nullable: true })
  fechaExpiracion!: Date | null;

  @Column({ type: 'int', name: 'usos_maximos', nullable: true })
  usosMaximos!: number | null;

  @Column({ name: 'usos_actuales', default: 0 })
  usosActuales!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
