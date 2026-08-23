import { Entity as TypeOrmEntity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@TypeOrmEntity('usuarios')
export class UsuarioOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ default: 'estudiante' })
  rol!: string;

  @CreateDateColumn()
  created_at!: Date;
}
