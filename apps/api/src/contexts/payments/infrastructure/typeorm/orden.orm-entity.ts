import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { OrdenItemOrmEntity } from './orden-item.orm-entity';

@Entity('ordenes')
export class OrdenOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @OneToMany(() => OrdenItemOrmEntity, (item) => item.orden, { cascade: true })
  items!: OrdenItemOrmEntity[];

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
