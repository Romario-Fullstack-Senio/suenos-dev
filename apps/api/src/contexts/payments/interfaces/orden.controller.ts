import { Body, Controller, Post, Get, Param, Req, Res, UseGuards, Inject, ForbiddenException } from '@nestjs/common';
import type { Response } from 'express';
import { CrearOrdenUseCase, CrearOrdenCommand } from '../application/crear-orden.use-case';
import { ReembolsarOrdenUseCase } from '../application/reembolsar-orden.use-case';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  ORDEN_REPOSITORY,
  OrdenRepository,
} from '../domain/orden.repository.port';
import { FACTURA_GENERATOR, FacturaGenerator } from '../domain/factura-generator.port';
import { EventBus } from '../../../common/event-bus';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  completada: 'Pagado',
  fallida: 'Fallido',
  reembolsada: 'Reembolsado',
};

@Controller('ordenes')
export class OrdenController {
  constructor(
    private readonly crearOrden: CrearOrdenUseCase,
    private readonly reembolsarOrdenUC: ReembolsarOrdenUseCase,
    @Inject(ORDEN_REPOSITORY) private readonly ordenRepository: OrdenRepository,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
    @Inject(FACTURA_GENERATOR) private readonly facturaGenerator: FacturaGenerator,
    private readonly eventBus: EventBus,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crear(@Body() command: CrearOrdenCommand) {
    return this.crearOrden.execute(command);
  }

  @Get('mias')
  @UseGuards(JwtAuthGuard)
  async misOrdenes(@Req() req: AuthenticatedRequest) {
    const ordenes = await this.ordenRepository.findByEstudianteId(req.user.id);

    return ordenes.map((o) => ({
      id: o.id,
      items: o.items.map((i) => ({ cursoId: i.cursoId, cursoNombre: i.cursoNombre, precio: i.precio })),
      monto: o.monto,
      moneda: o.moneda,
      estado: o.estado,
      createdAt: o.createdAt,
    }));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listarTodas() {
    const ordenes = await this.ordenRepository.findAll();
    const usuarios = await Promise.all(ordenes.map(o => this.usuarioRepository.findById(o.estudianteId)));

    return ordenes.map((o, i) => ({
      id: o.id,
      items: o.items.map((it) => ({ cursoId: it.cursoId, cursoNombre: it.cursoNombre, precio: it.precio })),
      estudianteNombre: usuarios[i]?.nombre ?? 'Estudiante',
      estudianteEmail: usuarios[i]?.email.value ?? '',
      monto: o.monto,
      moneda: o.moneda,
      estado: o.estado,
      createdAt: o.createdAt,
    }));
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmar(@Param('id') id: string) {
    const orden = await this.ordenRepository.findById(id);

    if (!orden) {
      return { error: 'Orden no encontrada' };
    }

    if (orden.estado === 'completada') {
      return { message: 'Orden ya completada', ordenId: orden.id };
    }

    // Look up user data for the email event — el nombre de cada curso ya
    // viene denormalizado en orden.items.
    let alumnoEmail = '';
    let alumnoNombre = '';

    try {
      const usuario = await this.usuarioRepository.findById(orden.estudianteId);
      if (usuario) {
        alumnoEmail = usuario.email.value || String(usuario.email);
        alumnoNombre = usuario.nombre;
      }
    } catch {
      // Best-effort: si falla la lectura, el email sale con campos vacíos
      // en vez de tumbar la confirmación del pago.
    }

    orden.completar({ email: alumnoEmail, nombre: alumnoNombre });
    await this.ordenRepository.save(orden);

    for (const event of orden.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }

    return { message: 'Pago confirmado', ordenId: orden.id };
  }

  @Post(':id/reembolso')
  @UseGuards(JwtAuthGuard)
  async reembolsar(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.reembolsarOrdenUC.execute({ ordenId: id, callerId: req.user.id, callerRol: req.user.rol });
    return { message: 'Reembolso procesado correctamente' };
  }

  @Get(':id/factura')
  @UseGuards(JwtAuthGuard)
  async factura(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const orden = await this.ordenRepository.findById(id);
    if (!orden) {
      res.status(404).json({ message: 'Orden no encontrada' });
      return;
    }
    if (req.user.rol !== 'admin' && orden.estudianteId !== req.user.id) {
      throw new ForbiddenException('No tenés acceso a este comprobante');
    }

    const usuario = await this.usuarioRepository.findById(orden.estudianteId);

    const pdf = await this.facturaGenerator.generate({
      numeroComprobante: orden.id.slice(0, 8).toUpperCase(),
      fecha: orden.createdAt,
      compradorNombre: usuario?.nombre ?? 'Estudiante',
      compradorEmail: usuario?.email.value ?? '',
      items: orden.items.map((i) => ({ nombre: i.cursoNombre, precio: i.precio })),
      monto: orden.monto,
      moneda: orden.moneda,
      estado: ESTADO_LABEL[orden.estado] ?? orden.estado,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="comprobante-${orden.id.slice(0, 8)}.pdf"`,
    });
    res.send(pdf);
  }
}
