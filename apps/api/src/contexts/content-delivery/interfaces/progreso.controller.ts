import { Body, Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { RegistrarProgresoUseCase } from '../application/registrar-progreso.use-case';
import { IsString, IsNumber, IsPositive } from 'class-validator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Inject } from '@nestjs/common';
import {
  PROGRESO_LECCION_REPOSITORY,
  ProgresoLeccionRepository,
} from '../domain/progreso-leccion.repository.port';

class RegistrarProgresoDto {
  @IsString()
  leccionId!: string;

  @IsString()
  cursoId!: string;

  @IsNumber()
  @IsPositive()
  segundosVistos!: number;

  @IsNumber()
  @IsPositive()
  duracionTotal!: number;
}

@Controller('progreso')
@UseGuards(JwtAuthGuard)
export class ProgresoController {
  constructor(
    private readonly registrarProgresoUseCase: RegistrarProgresoUseCase,
    @Inject(PROGRESO_LECCION_REPOSITORY)
    private readonly progresoRepository: ProgresoLeccionRepository,
  ) {}

  @Post()
  async registrar(@Body() dto: RegistrarProgresoDto, @Query('estudianteId') estudianteId: string) {
    await this.registrarProgresoUseCase.execute({
      estudianteId,
      leccionId: dto.leccionId,
      cursoId: dto.cursoId,
      segundosVistos: dto.segundosVistos,
      duracionTotal: dto.duracionTotal,
    });
    return { success: true };
  }

  @Get('curso/:cursoId')
  async getProgresoCurso(
    @Param('cursoId') cursoId: string,
    @Query('estudianteId') estudianteId: string,
  ) {
    const progresos = await this.progresoRepository.findByCursoYEstudiante(
      cursoId,
      estudianteId,
    );

    const leccionesCompletadas = progresos.filter(p => p.completada).length;

    return {
      cursoId,
      leccionesCompletadas,
      progresos: progresos.map(p => ({
        leccionId: p.leccionId,
        porcentaje: p.porcentaje.value,
        completada: p.completada,
      })),
    };
  }
}
