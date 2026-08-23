import { Entity as TypeOrmEntity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ModuloOrmEntity } from './modulo.orm-entity';

@TypeOrmEntity('lecciones')
export class LeccionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  titulo!: string;

  @Column('int')
  orden!: number;

  @Column('int')
  duracion_segundos!: number;

  @Column('varchar', { nullable: true })
  video_url!: string | null;

  @Column('uuid')
  modulo_id!: string;

  @ManyToOne(() => ModuloOrmEntity, (m) => m.lecciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modulo_id' })
  modulo!: ModuloOrmEntity;
}
