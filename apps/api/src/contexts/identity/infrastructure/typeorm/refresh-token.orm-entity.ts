import { Entity, PrimaryColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokenOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @Index({ unique: true })
  @Column({ name: 'token_hash' })
  tokenHash!: string;

  @Index()
  @Column({ name: 'family_id', type: 'uuid', nullable: true })
  familyId!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'timestamp' })
  expira!: Date;

  @Column({ default: false })
  revocado!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
