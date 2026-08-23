import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { QuizOrmEntity } from './quiz.orm-entity';

@Entity('preguntas')
export class PreguntaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  enunciado!: string;

  @Column('simple-json')
  opciones!: string[];

  @Column()
  respuestaCorrecta!: number;

  @Column({ name: 'quiz_id' })
  quiz_id!: string;

  @ManyToOne(() => QuizOrmEntity, (quiz) => quiz.preguntas)
  @JoinColumn({ name: 'quiz_id' })
  quiz!: QuizOrmEntity;
}
