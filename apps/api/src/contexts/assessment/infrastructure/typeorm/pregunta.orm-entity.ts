import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { QuizOrmEntity } from './quiz.orm-entity';

@Entity('preguntas')
export class PreguntaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  enunciado!: string;

  @Column('simple-json')
  opciones!: string[];

  @Column({ default: 'opcion_unica' })
  tipo!: string;

  @Column('simple-json', { name: 'respuestas_correctas' })
  respuestasCorrectas!: number[];

  @Index()
  @Column({ name: 'quiz_id' })
  quiz_id!: string;

  @ManyToOne(() => QuizOrmEntity, (quiz) => quiz.preguntas)
  @JoinColumn({ name: 'quiz_id' })
  quiz!: QuizOrmEntity;
}
