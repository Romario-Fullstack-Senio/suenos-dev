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

    let totalInscripciones = 0;
    let ingresosEstimados = 0;
    for (const curso of cursos) {
      // Antes esto multiplicaba TODAS las inscripciones (de cualquier curso
      // del instructor) por el precio de cursos[0] únicamente — los ingresos
      // quedaban mal si el instructor tenía más de un curso con precios
      // distintos. Ahora se suma por curso, cada uno con su propio precio.
      const inscripciones = await this.inscripcionRepository.findByCursoId(curso.id);
      totalInscripciones += inscripciones.length;
      ingresosEstimados += inscripciones.length * curso.precio.value;
    }

    return {
      totalCursos: cursos.length,
      totalInscripciones,
      ingresosEstimados,
    };
  }
}
