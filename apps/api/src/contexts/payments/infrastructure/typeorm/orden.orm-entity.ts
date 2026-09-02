import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ordenes')
export class OrdenOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @Index()
  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Column('decimal')
  monto!: number;

  @Column()
  moneda!: string;

  @Index({ unique: true })
  @Column({ name: 'stripe_session_id' })
  stripeSessionId!: string;

  @Column()
  estado!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
