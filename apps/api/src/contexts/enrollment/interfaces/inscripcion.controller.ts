import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  InscripcionRepository,
  INSCRIPCION_REPOSITORY,
} from '../domain/inscripcion.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('inscripciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InscripcionController {
  constructor(
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepository: InscripcionRepository,
  ) {}

  @Get('estudiante/:estudianteId')
  @Roles('estudiante', 'admin')
  async listarPorEstudiante(@Param('estudianteId') estudianteId: string) {
    return this.inscripcionRepository.findAllByEstudiante(estudianteId);
  }
}
