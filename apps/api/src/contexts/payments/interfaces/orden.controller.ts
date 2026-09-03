import { Body, Controller, Post, Param, UseGuards, Inject } from '@nestjs/common';
import { CrearOrdenUseCase, CrearOrdenCommand } from '../application/crear-orden.use-case';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  ORDEN_REPOSITORY,
  OrdenRepository,
} from '../domain/orden.repository.port';
import { EventBus } from '../../../common/event-bus';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

@Controller('ordenes')
export class OrdenController {
  constructor(
    private readonly crearOrden: CrearOrdenUseCase,
    @Inject(ORDEN_REPOSITORY) private readonly ordenRepository: OrdenRepository,
    @Inject(CURSO_REPOSITORY) private readonly cursoRepository: CursoRepository,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crear(@Body() command: CrearOrdenCommand) {
    return this.crearOrden.execute(command);
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

    // Look up user and course data for the email event
    let alumnoEmail = '';
    let alumnoNombre = '';
    let cursoNombre = '';

    try {
      const usuario = await this.usuarioRepository.findById(orden.estudianteId);
      if (usuario) {
        alumnoEmail = usuario.email.value || String(usuario.email);
        alumnoNombre = usuario.nombre;
      }
    } catch {}

    try {
      const curso = await this.cursoRepository.findById(orden.cursoId);
      if (curso) {
        cursoNombre = curso.titulo;
      }
    } catch {}

    orden.completar({
      alumnoEmail,
      alumnoNombre,
      cursoNombre,
      precio: orden.monto,
    });
    await this.ordenRepository.save(orden);

    for (const event of orden.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }

    return { message: 'Pago confirmado', ordenId: orden.id };
  }
}
