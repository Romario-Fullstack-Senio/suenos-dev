import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  InscripcionRepository,
  INSCRIPCION_REPOSITORY,
} from '../domain/inscripcion.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { OwnershipGuard } from '../../../common/guards/ownership.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequireOwnership } from '../../../common/decorators/ownership.decorator';

@Controller('inscripciones')
@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
export class InscripcionController {
  constructor(
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepository: InscripcionRepository,
  ) {}

  // @Roles solo garantizaba "sos estudiante", no "sos ESTE estudiante":
  // cualquier alumno podía ver los cursos comprados por otro cambiando el id.
  @Get('estudiante/:estudianteId')
  @Roles('estudiante', 'admin')
  @RequireOwnership({ paramName: 'estudianteId' })
  async listarPorEstudiante(@Param('estudianteId') estudianteId: string) {
    const inscripciones = await this.inscripcionRepository.findAllByEstudiante(estudianteId);
    // Mapeo explícito a DTO: devolver el agregado de dominio tal cual serializa
    // sus campos internos (_id, _domainEvents, props) en vez de `id` plano —
    // rompe cualquier consumidor que espere el contrato normal (p. ej. React
    // usando `insc.id` como key, que quedaba `undefined`).
    return inscripciones.map((i) => ({
      id: i.id,
      estudianteId: i.estudianteId,
      cursoId: i.cursoId,
      fechaInscripcion: i.fechaInscripcion,
      activa: i.activa,
    }));
  }
}
