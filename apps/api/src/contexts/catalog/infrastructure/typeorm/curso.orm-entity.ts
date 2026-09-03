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

  @Column({ type: 'varchar', nullable: true })
  imagen_url!: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  categoria!: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  nivel!: string | null;

  // simple-json (no simple-array): los ítems son frases libres que pueden
  // contener comas, y simple-array de TypeORM las cortaría sin escapar.
  @Column({ type: 'simple-json', nullable: true })
  objetivos!: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  requisitos!: string[] | null;

  @Column({ type: 'text', nullable: true })
  audiencia!: string | null;

  @OneToMany(() => ModuloOrmEntity, (m) => m.curso, { cascade: true })
  modulos!: ModuloOrmEntity[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
