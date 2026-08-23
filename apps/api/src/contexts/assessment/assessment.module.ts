import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizOrmEntity } from './infrastructure/typeorm/quiz.orm-entity';
import { PreguntaOrmEntity } from './infrastructure/typeorm/pregunta.orm-entity';
import { IntentoOrmEntity } from './infrastructure/typeorm/intento.orm-entity';
import { QuizTypeOrmRepository } from './infrastructure/typeorm/quiz.typeorm-repository';
import { CrearQuizUseCase } from './application/crear-quiz.use-case';
import { ResolverQuizUseCase } from './application/resolver-quiz.use-case';
import { QuizController } from './interfaces/quiz.controller';
import { QUIZ_REPOSITORY } from './domain/quiz.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizOrmEntity, PreguntaOrmEntity, IntentoOrmEntity]),
  ],
  controllers: [QuizController],
  providers: [
    {
      provide: QUIZ_REPOSITORY,
      useClass: QuizTypeOrmRepository,
    },
    CrearQuizUseCase,
    ResolverQuizUseCase,
  ],
  exports: [CrearQuizUseCase, ResolverQuizUseCase],
})
export class AssessmentModule {}
