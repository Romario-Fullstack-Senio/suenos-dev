import { Entity as TypeOrmEntity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { CursoOrmEntity } from './curso.orm-entity';
import { LeccionOrmEntity } from './leccion.orm-entity';

@TypeOrmEntity('modulos')
export class ModuloOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  titulo!: string;

  @Column('int')
  orden!: number;

  @Index()
  @Column('uuid')
  curso_id!: string;

  @ManyToOne(() => CursoOrmEntity, (c) => c.modulos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curso_id' })
  curso!: CursoOrmEntity;

  @OneToMany(() => LeccionOrmEntity, (l) => l.modulo, { cascade: true })
  lecciones!: LeccionOrmEntity[];
}
