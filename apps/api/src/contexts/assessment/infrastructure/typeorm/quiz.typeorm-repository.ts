import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../../domain/quiz.entity';
import { Pregunta } from '../../domain/pregunta.entity';
import { QuizRepository } from '../../domain/quiz.repository.port';
import { QuizOrmEntity } from './quiz.orm-entity';
import { PreguntaOrmEntity } from './pregunta.orm-entity';

@Injectable()
export class QuizTypeOrmRepository implements QuizRepository {
  constructor(
    @InjectRepository(QuizOrmEntity)
    private readonly quizRepository: Repository<QuizOrmEntity>,
    @InjectRepository(PreguntaOrmEntity)
    private readonly preguntaRepository: Repository<PreguntaOrmEntity>,
  ) {}

  async save(quiz: Quiz): Promise<void> {
    const ormEntity = new QuizOrmEntity();
    ormEntity.id = quiz.id;
    ormEntity.titulo = quiz.titulo;
    ormEntity.cursoId = quiz.cursoId;
    ormEntity.puntajeMinimo = quiz.puntajeMinimo;
    ormEntity.preguntas = quiz.preguntas.map((p: Pregunta) => {
      const preguntaOrm = new PreguntaOrmEntity();
      preguntaOrm.id = p.id;
      preguntaOrm.enunciado = p.enunciado;
      preguntaOrm.opciones = p.opciones;
      preguntaOrm.respuestaCorrecta = p.respuestaCorrecta;
      preguntaOrm.quiz_id = quiz.id;
      return preguntaOrm;
    });

    await this.quizRepository.save(ormEntity);
  }

  async findById(id: string): Promise<Quiz | null> {
    const ormEntity = await this.quizRepository.findOne({
      where: { id },
      relations: ['preguntas'],
    });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  async findByCursoId(cursoId: string): Promise<Quiz[]> {
    const ormEntities = await this.quizRepository.find({
      where: { cursoId },
      relations: ['preguntas'],
    });

    return ormEntities.map((entity) => this.toDomain(entity));
  }

  private toDomain(ormEntity: QuizOrmEntity): Quiz {
    const preguntas = ormEntity.preguntas.map((p) =>
      Pregunta.crear(p.id, p.enunciado, p.opciones, p.respuestaCorrecta),
    );

    const quiz = Quiz.crear(ormEntity.id, ormEntity.titulo, ormEntity.cursoId, ormEntity.puntajeMinimo);
    for (const pregunta of preguntas) {
      quiz.agregarPregunta(pregunta);
    }
    return quiz;
  }
}
