import { Entity, PrimaryColumn, Column, OneToMany, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RespuestaForoOrmEntity } from './respuesta-foro.orm-entity';

@Entity('foro_temas')
export class TemaForoOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'autor_id' })
  autorId!: string;

  @Column({ name: 'autor_nombre' })
  autorNombre!: string;

  @Column()
  titulo!: string;

  @Column({ type: 'text' })
  texto!: string;

  @Index()
  @Column({ default: 'general' })
  categoria!: string;

  @Column({ default: false })
  fijado!: boolean;

  @Column({ default: false })
  cerrado!: boolean;

  @OneToMany(() => RespuestaForoOrmEntity, (respuesta) => respuesta.tema, { cascade: true })
  respuestas!: RespuestaForoOrmEntity[];

  // Ver el mismo par de columnas en ResenaOrmEntity/PreguntaOrmEntity.
  @Column({ name: 'reportado_por', type: 'simple-json', nullable: true })
  reportadoPor!: string[] | null;

  @Column({ default: false })
  oculta!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
