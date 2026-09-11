import { Body, Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RegistrarProgresoUseCase } from '../application/registrar-progreso.use-case';
import { IsString, IsNumber, IsPositive } from 'class-validator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Inject } from '@nestjs/common';
import {
  PROGRESO_LECCION_REPOSITORY,
  ProgresoLeccionRepository,
} from '../domain/progreso-leccion.repository.port';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

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

  // El estudiante sale SIEMPRE del JWT, nunca del request. Antes ambas rutas
  // lo leían de ?estudianteId=, que el cliente elige: cualquier usuario
  // logueado podía escribir progreso a nombre de otro (POST) o leer el
  // progreso ajeno (GET) cambiando el query param. Además, si el param no
  // venía, el insert explotaba contra el NOT NULL de estudiante_id y
  // devolvía 500 en vez de un error claro.
  @Post()
  async registrar(@Body() dto: RegistrarProgresoDto, @Req() req: AuthenticatedRequest) {
    await this.registrarProgresoUseCase.execute({
      estudianteId: req.user.id,
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
    @Req() req: AuthenticatedRequest,
  ) {
    const progresos = await this.progresoRepository.findByCursoYEstudiante(
      cursoId,
      req.user.id,
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
