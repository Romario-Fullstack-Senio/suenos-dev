import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('paquetes')
export class PaqueteOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  titulo!: string;

  @Column({ type: 'text', default: '' })
  descripcion!: string;

  @Column({ name: 'curso_ids', type: 'simple-json' })
  cursoIds!: string[];

  @Column({ name: 'descuento_porcentaje', type: 'int' })
  descuentoPorcentaje!: number;

  @Column({ default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
