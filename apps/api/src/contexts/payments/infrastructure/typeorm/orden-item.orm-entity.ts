import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { OrdenOrmEntity } from './orden.orm-entity';

@Entity('orden_items')
export class OrdenItemOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'orden_id' })
  ordenId!: string;

  @ManyToOne(() => OrdenOrmEntity, (orden) => orden.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orden_id' })
  orden?: OrdenOrmEntity;

  @Index()
  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Column({ name: 'curso_nombre' })
  cursoNombre!: string;

  @Column('decimal')
  precio!: number;
}
