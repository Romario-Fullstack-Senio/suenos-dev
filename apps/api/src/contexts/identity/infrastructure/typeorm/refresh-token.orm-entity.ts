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

  @Column({ type: 'timestamp' })
  expira!: Date;

  @Column({ default: false })
  revocado!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
