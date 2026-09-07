import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('perfiles_gamificacion')
export class PerfilGamificacionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @Column({ default: 0 })
  puntos!: number;

  @Column({ name: 'lecciones_completadas', default: 0 })
  leccionesCompletadas!: number;

  @Column({ name: 'cursos_comprados', default: 0 })
  cursosComprados!: number;

  @Column({ name: 'quizzes_aprobados', default: 0 })
  quizzesAprobados!: number;

  @Column({ name: 'racha_actual', default: 0 })
  rachaActual!: number;

  @Column({ name: 'racha_maxima', default: 0 })
  rachaMaxima!: number;

  // timestamp (no `date`) para que el driver siempre lo devuelva como
  // Date de JS de forma consistente — el resto del código lo trunca a
  // día igual (ver truncarADia en la entidad de dominio).
  @Column({ name: 'ultima_actividad_fecha', type: 'timestamp', nullable: true })
  ultimaActividadFecha!: Date | null;

  // simple-array de strings (ids de InsigniaId) — catálogo estático y
  // chico, no amerita una tabla de relación aparte.
  @Column({ name: 'insignias_obtenidas', type: 'simple-json', nullable: true })
  insigniasObtenidas!: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
