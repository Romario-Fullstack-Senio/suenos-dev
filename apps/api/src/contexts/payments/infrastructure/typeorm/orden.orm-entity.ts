import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ordenes')
export class OrdenOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Column('decimal')
  monto!: number;

  @Column()
  moneda!: string;

  @Column({ name: 'stripe_session_id' })
  stripeSessionId!: string;

  @Column()
  estado!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
