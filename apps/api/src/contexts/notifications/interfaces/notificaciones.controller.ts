import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/infrastructure/jwt/jwt-auth.guard';
import { NotificacionService } from '../application/notificacion.service';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionService: NotificacionService) {}

  @Get('usuario/:userId')
  @ApiOperation({ summary: 'Obtener notificaciones de un usuario' })
  async findByUsuario(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const notificaciones = await this.notificacionService.findByUsuario(
      userId,
      limit ? parseInt(limit, 10) : 20,
    );
    return notificaciones.map((n: any) => ({
      id: n.id,
      titulo: n.titulo,
      mensaje: n.mensaje,
      tipo: n.tipo,
      cursoId: n.cursoId,
      leida: n.leida,
      fecha: n.createdAt,
    }));
  }

  @Get('usuario/:userId/no-leidas')
  @ApiOperation({ summary: 'Contar notificaciones no leídas' })
  async countNoLeidas(@Param('userId') userId: string) {
    const count = await this.notificacionService.countNoLeidas(userId);
    return { count };
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  async marcarLeida(@Param('id') id: string) {
    await this.notificacionService.marcarComoLeida(id);
    return { ok: true };
  }

  @Patch('usuario/:userId/leer-todas')
  @ApiOperation({ summary: 'Marcar todas como leídas' })
  async marcarTodasLeidas(@Param('userId') userId: string) {
    await this.notificacionService.marcarTodasLeidas(userId);
    return { ok: true };
  }
}
