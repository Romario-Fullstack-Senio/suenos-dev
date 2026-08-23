import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PreguntaOrmEntity } from './pregunta.orm-entity';

@Entity('quizzes')
export class QuizOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  titulo!: string;

  @Column()
  cursoId!: string;

  @Column()
  puntajeMinimo!: number;

  @OneToMany(() => PreguntaOrmEntity, (pregunta) => pregunta.quiz, { cascade: true })
  preguntas!: PreguntaOrmEntity[];
}
