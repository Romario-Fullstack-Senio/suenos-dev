import { Entity as TypeOrmEntity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@TypeOrmEntity('usuarios')
export class UsuarioOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  password_hash!: string | null;

  @Column({ default: 'estudiante' })
  rol!: string;

  @Column({ type: 'varchar', default: 'local' })
  auth_provider!: string;

  @Column({ type: 'varchar', nullable: true })
  provider_id!: string | null;

  @Column({ default: false })
  email_verificado!: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificacion_token!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificacion_token_expira!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  reset_password_token!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reset_password_expira!: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
