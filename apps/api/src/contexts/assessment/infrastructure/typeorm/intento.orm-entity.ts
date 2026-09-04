import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('intentos')
export class IntentoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'estudiante_id' })
  estudiante_id!: string;

  @Index()
  @Column({ name: 'quiz_id' })
  quiz_id!: string;

  @Column('simple-json')
  respuestas!: number[][];

  @Column('decimal', { precision: 5, scale: 2 })
  puntaje!: number;

  @Column()
  aprobado!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  created_at!: Date;
}
