import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { NotificacionService } from './notificacion.service';
import { Notificacion } from '../domain/notificacion.entity';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

interface TicketCreadoEvent {
  aggregateId: string;
  usuarioId: string;
  usuarioNombre: string;
  asunto: string;
}

/** Avisa in-app a todos los admins que hay un ticket de soporte nuevo. Solo
 * in-app (no email) — son pocos admins y ya revisan el panel seguido; si el
 * volumen crece esto es lo primero a mandar por email también. */
@Injectable()
export class NotificarTicketCreadoHandler {
  private readonly logger = new Logger(NotificarTicketCreadoHandler.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly notificacionService: NotificacionService,
  ) {}

  @OnEvent('TicketCreado')
  async handle(event: TicketCreadoEvent): Promise<void> {
    this.logger.log(`[EVENT] TicketCreado recibido: "${event.asunto}" de ${event.usuarioNombre}`);

    const usuarios = await this.usuarioRepo.findAll();
    const admins = usuarios.filter((u) => u.rol.value === 'admin');

    for (const admin of admins) {
      await this.notificacionService.guardar(
        Notificacion.crear({
          id: uuid(),
          usuarioId: admin.id,
          titulo: 'Nuevo ticket de soporte',
          mensaje: `${event.usuarioNombre}: "${event.asunto}"`,
          tipo: 'ticket_nuevo',
        }),
      );
    }
  }
}
