import { Body, Controller, Get, Post, Delete, Param, Query, Req, Inject, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { CrearOActualizarResenaUseCase } from '../application/crear-o-actualizar-resena.use-case';
import { ListarResenasUseCase } from '../application/listar-resenas.use-case';
import { ResumenResenasUseCase } from '../application/resumen-resenas.use-case';
import { EliminarResenaUseCase } from '../application/eliminar-resena.use-case';
import { RESENA_REPOSITORY, ResenaRepository } from '../domain/resena.repository.port';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller()
export class ResenaController {
  constructor(
    private readonly crearOActualizarUC: CrearOActualizarResenaUseCase,
    private readonly listarUC: ListarResenasUseCase,
    private readonly resumenUC: ResumenResenasUseCase,
    private readonly eliminarUC: EliminarResenaUseCase,
    @Inject(RESENA_REPOSITORY)
    private readonly resenaRepository: ResenaRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
  ) {}

  // Panel de moderación del admin — todas las reseñas de la plataforma,
  // no solo las de un curso puntual.
  @Get('resenas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listarTodas() {
    const resenas = await this.resenaRepository.findAll();
    const cursoIds = Array.from(new Set(resenas.map(r => r.cursoId)));
    const cursos = await Promise.all(cursoIds.map(id => this.cursoRepository.findById(id)));
    const nombresPorCurso = new Map(cursoIds.map((id, i) => [id, cursos[i]?.titulo ?? 'Curso']));

    return resenas.map(r => ({
      id: r.id,
      cursoId: r.cursoId,
      cursoNombre: nombresPorCurso.get(r.cursoId) ?? 'Curso',
      estudianteNombre: r.estudianteNombre,
      calificacion: r.calificacion,
      comentario: r.comentario,
      createdAt: r.createdAt,
    }));
  }

  @Get('cursos/:cursoId/resenas')
  async listar(@Param('cursoId') cursoId: string) {
    return this.listarUC.execute(cursoId);
  }

  @Get('resenas/resumen')
  async resumen(@Query('cursoIds') cursoIds: string) {
    const ids = (cursoIds ?? '').split(',').map(id => id.trim()).filter(Boolean);
    return this.resumenUC.execute(ids);
  }

  @Post('cursos/:cursoId/resenas')
  @UseGuards(JwtAuthGuard)
  async crearOActualizar(
    @Param('cursoId') cursoId: string,
    @Body() dto: CrearResenaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.crearOActualizarUC.execute({
      cursoId,
      estudianteId: req.user.id,
      calificacion: dto.calificacion,
      comentario: dto.comentario,
    });
  }

  @Delete('resenas/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.eliminarUC.execute({ resenaId: id, callerId: req.user.id, callerRol: req.user.rol });
    return { message: 'Reseña eliminada correctamente' };
  }
}
