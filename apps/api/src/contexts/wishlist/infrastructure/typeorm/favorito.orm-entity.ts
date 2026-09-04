import { Entity, PrimaryColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('favoritos')
@Index(['usuarioId', 'cursoId'], { unique: true })
export class FavoritoOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @Index()
  @Column({ name: 'curso_id' })
  cursoId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
