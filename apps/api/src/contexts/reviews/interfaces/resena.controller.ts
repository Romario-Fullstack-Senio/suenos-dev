import { Body, Controller, Get, Post, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { CrearOActualizarResenaUseCase } from '../application/crear-o-actualizar-resena.use-case';
import { ListarResenasUseCase } from '../application/listar-resenas.use-case';
import { ResumenResenasUseCase } from '../application/resumen-resenas.use-case';
import { EliminarResenaUseCase } from '../application/eliminar-resena.use-case';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

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
  ) {}

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
