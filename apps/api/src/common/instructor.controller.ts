import { Controller, Get, Inject, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CURSO_REPOSITORY, CursoRepository } from '../contexts/catalog/domain/curso.repository.port';
import { INSCRIPCION_REPOSITORY, InscripcionRepository } from '../contexts/enrollment/domain/inscripcion.repository.port';

@Controller('instructor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('instructor')
export class InstructorController {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepository: InscripcionRepository,
  ) {}

  @Get('stats/:instructorId')
  async getStats(@Param('instructorId') instructorId: string) {
    const cursos = await this.cursoRepository.findByInstructorId(instructorId);
    const cursoIds = cursos.map(c => c.id);

    let totalInscripciones = 0;
    for (const cursoId of cursoIds) {
      const inscripciones = await this.inscripcionRepository.findByCursoId(cursoId);
      totalInscripciones += inscripciones.length;
    }

    const ingresosEstimados = totalInscripciones * (cursos[0]?.precio.value || 0);

    return {
      totalCursos: cursos.length,
      totalInscripciones,
      ingresosEstimados,
    };
  }
}
