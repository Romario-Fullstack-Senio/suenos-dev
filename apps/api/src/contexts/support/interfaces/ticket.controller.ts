import { Body, Controller, Get, Post, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CrearTicketUseCase } from '../application/crear-ticket.use-case';
import { ResponderTicketUseCase } from '../application/responder-ticket.use-case';
import { ListarTicketsUseCase } from '../application/listar-tickets.use-case';
import { ObtenerTicketUseCase } from '../application/obtener-ticket.use-case';
import { CambiarEstadoTicketUseCase } from '../application/cambiar-estado-ticket.use-case';
import { Ticket, EstadoTicket } from '../domain/ticket.entity';
import { CrearTicketDto } from './dto/crear-ticket.dto';
import { CrearMensajeTicketDto } from './dto/crear-mensaje-ticket.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

function mapTicket(t: Ticket) {
  return {
    id: t.id,
    usuarioId: t.usuarioId,
    usuarioNombre: t.usuarioNombre,
    asunto: t.asunto,
    categoria: t.categoria,
    estado: t.estado,
    createdAt: t.createdAt,
    mensajes: t.mensajes.map((m) => ({
      id: m.id,
      autorId: m.autorId,
      autorNombre: m.autorNombre,
      autorEsAdmin: m.autorEsAdmin,
      texto: m.texto,
      createdAt: m.createdAt,
    })),
  };
}

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(
    private readonly crearTicketUC: CrearTicketUseCase,
    private readonly responderTicketUC: ResponderTicketUseCase,
    private readonly listarTicketsUC: ListarTicketsUseCase,
    private readonly obtenerTicketUC: ObtenerTicketUseCase,
    private readonly cambiarEstadoTicketUC: CambiarEstadoTicketUseCase,
  ) {}

  // "mios" ANTES de ":id" — mismo criterio que UsuarioController.me().
  @Get('mios')
  async misTickets(@Req() req: AuthenticatedRequest) {
    const tickets = await this.listarTicketsUC.execute({ usuarioId: req.user.id, admin: false });
    return tickets.map(mapTicket);
  }

  // Todos los tickets — solo tiene sentido para un admin, pero no lo
  // gateamos con @Roles: si un estudiante pega la URL, listarTicketsUC
  // simplemente le devuelve SUS tickets (admin: false), no un 403 confuso.
  @Get()
  async listar(@Req() req: AuthenticatedRequest, @Query('estado') estado?: string) {
    const esAdmin = req.user.rol === 'admin';
    const tickets = await this.listarTicketsUC.execute({
      usuarioId: req.user.id,
      admin: esAdmin,
      estado: estado as EstadoTicket | undefined,
    });
    return tickets.map(mapTicket);
  }

  @Post()
  async crear(@Body() dto: CrearTicketDto, @Req() req: AuthenticatedRequest) {
    const ticket = await this.crearTicketUC.execute({
      usuarioId: req.user.id,
      asunto: dto.asunto,
      categoria: dto.categoria,
      texto: dto.texto,
    });
    return mapTicket(ticket);
  }

  @Get(':id')
  async obtener(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const ticket = await this.obtenerTicketUC.execute(id, req.user.id, req.user.rol === 'admin');
    return mapTicket(ticket);
  }

  @Post(':id/mensajes')
  async responder(@Param('id') id: string, @Body() dto: CrearMensajeTicketDto, @Req() req: AuthenticatedRequest) {
    await this.responderTicketUC.execute({
      ticketId: id,
      callerId: req.user.id,
      callerEsAdmin: req.user.rol === 'admin',
      texto: dto.texto,
    });
    return { message: 'Mensaje enviado' };
  }

  @Patch(':id/estado')
  async cambiarEstado(@Param('id') id: string, @Body('estado') estado: string, @Req() req: AuthenticatedRequest) {
    await this.cambiarEstadoTicketUC.execute(id, estado, req.user.rol === 'admin');
    return { message: 'Estado actualizado' };
  }
}
