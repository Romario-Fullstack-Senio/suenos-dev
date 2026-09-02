import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('inscripciones')
export class InscripcionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Sin FK real a propósito: `estudianteId`/`cursoId` referencian agregados de
  // otros bounded contexts (identity/catalog) por id, como manda DDD — una FK
  // cruzando contextos acoplaría infraestructura entre módulos que solo deben
  // comunicarse por eventos. El índice sí es necesario: son las columnas de
  // búsqueda de "mis cursos" / "quién está inscrito".
  @Index()
  @Column({ name: 'estudiante_id' })
  estudianteId!: string;

  @Index()
  @Column({ name: 'curso_id' })
  cursoId!: string;

  @CreateDateColumn({ name: 'fecha_inscripcion' })
  fechaInscripcion!: Date;

  @Column({ default: true })
  activa!: boolean;
}
