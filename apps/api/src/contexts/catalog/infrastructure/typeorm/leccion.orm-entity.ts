import { Entity as TypeOrmEntity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
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

  // Postgres no crea índice automático en el lado que referencia una FK
  // (solo en el lado referenciado) — sin esto, cada JOIN/lookup por módulo escanea toda la tabla.
  @Index()
  @Column('uuid')
  modulo_id!: string;

  @ManyToOne(() => ModuloOrmEntity, (m) => m.lecciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modulo_id' })
  modulo!: ModuloOrmEntity;
}
