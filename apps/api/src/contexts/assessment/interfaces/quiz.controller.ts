import { Body, Controller, Get, Post, Param, Inject, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CrearQuizUseCase, CrearQuizCommand } from '../application/crear-quiz.use-case';
import { ResolverQuizUseCase, ResolverQuizCommand } from '../application/resolver-quiz.use-case';
import { ResolverQuizDto } from './dto/resolver-quiz.dto';
import { QUIZ_REPOSITORY, QuizRepository } from '../domain/quiz.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('quizzes')
export class QuizController {
  constructor(
    private readonly crearQuizUseCase: CrearQuizUseCase,
    private readonly resolverQuizUseCase: ResolverQuizUseCase,
    @Inject(QUIZ_REPOSITORY)
    private readonly quizRepository: QuizRepository,
  ) {}

  @Get(':cursoId')
  async findByCursoId(@Param('cursoId') cursoId: string) {
    const quizzes = await this.quizRepository.findByCursoId(cursoId);
    if (!quizzes || quizzes.length === 0) {
      return { message: 'No se encontraron quizzes para este curso' };
    }
    const quiz = quizzes[0];
    return {
      id: quiz.id,
      titulo: quiz.titulo,
      cursoId: quiz.cursoId,
      puntajeMinimo: quiz.puntajeMinimo,
      preguntas: quiz.preguntas.map(p => ({
        id: p.id,
        enunciado: p.enunciado,
        opciones: p.opciones,
        tipo: p.tipo,
      })),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async crear(@Body() command: CrearQuizCommand) {
    const quiz = await this.crearQuizUseCase.execute(command);
    return {
      id: quiz.id,
      titulo: quiz.titulo,
      cursoId: quiz.cursoId,
      puntajeMinimo: quiz.puntajeMinimo,
    };
  }

  @Post('resolver')
  @UseGuards(JwtAuthGuard)
  async resolver(@Body() dto: ResolverQuizDto, @Req() req: AuthenticatedRequest) {
    const command: ResolverQuizCommand = {
      quizId: dto.quizId,
      // El estudiante sale del JWT, NO del body. Con dto.estudianteId
      // cualquier usuario logueado podía aprobar el quiz a nombre de otro:
      // eso dispara QuizAprobado y le emite un certificado (+ puntos de
      // gamificación) a una persona que nunca rindió.
      estudianteId: req.user.id,
      respuestas: dto.respuestas,
    };
    const result = await this.resolverQuizUseCase.execute(command);
    return {
      intentoId: result.intento.id,
      puntaje: result.intento.puntaje,
      aprobado: result.aprobado,
    };
  }
}
