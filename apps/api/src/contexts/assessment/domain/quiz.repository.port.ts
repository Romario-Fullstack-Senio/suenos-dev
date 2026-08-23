import { Quiz } from './quiz.entity';

export const QUIZ_REPOSITORY = 'QUIZ_REPOSITORY';

export interface QuizRepository {
  save(quiz: Quiz): Promise<void>;
  findById(id: string): Promise<Quiz | null>;
  findByCursoId(cursoId: string): Promise<Quiz[]>;
}
