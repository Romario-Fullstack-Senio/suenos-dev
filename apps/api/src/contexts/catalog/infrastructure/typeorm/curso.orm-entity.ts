import { Entity as TypeOrmEntity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { ModuloOrmEntity } from './modulo.orm-entity';

@TypeOrmEntity('cursos')
export class CursoOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  titulo!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio!: number;

  @Column({ default: 'USD' })
  moneda!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ default: 'borrador' })
  estado!: string;

  @Index()
  @Column('uuid')
  instructor_id!: string;

  @OneToMany(() => ModuloOrmEntity, (m) => m.curso, { cascade: true })
  modulos!: ModuloOrmEntity[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
