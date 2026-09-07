import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('comisiones_afiliados')
export class ComisionAfiliadoOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'afiliado_id' })
  afiliadoId!: string;

  @Index()
  @Column({ name: 'referido_id' })
  referidoId!: string;

  @Column({ name: 'curso_id' })
  cursoId!: string;

  @Column({ name: 'curso_nombre' })
  cursoNombre!: string;

  @Column({ name: 'orden_id' })
  ordenId!: string;

  @Column('numeric')
  monto!: number;

  @Column({ name: 'comision_monto', type: 'numeric' })
  comisionMonto!: number;

  @Index()
  @Column({ default: 'pendiente' })
  estado!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
