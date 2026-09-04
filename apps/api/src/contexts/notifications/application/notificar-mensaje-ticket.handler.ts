import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { NotificacionService } from './notificacion.service';
import { Notificacion } from '../domain/notificacion.entity';
import { renderEmailLayout, emailButton } from './email-layout';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

interface MensajeTicketCreadoEvent {
  aggregateId: string;
  asunto: string;
  ticketUsuarioId: string;
  autorId: string;
  autorNombre: string;
  autorEsAdmin: boolean;
  texto: string;
}

/** Avisa a "la otra parte" del ticket que hay un mensaje nuevo — in-app +
 * email. Si respondió un admin, avisa al dueño del ticket; si respondió el
 * dueño, avisa a todos los admins (mismo criterio que TicketCreado). */
@Injectable()
export class NotificarMensajeTicketHandler {
  private readonly logger = new Logger(NotificarMensajeTicketHandler.name);
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly notificacionService: NotificacionService,
  ) {}

  @OnEvent('MensajeTicketCreado')
  async handle(event: MensajeTicketCreadoEvent): Promise<void> {
    this.logger.log(`[EVENT] MensajeTicketCreado recibido en ticket "${event.asunto}" de ${event.autorNombre}`);

    const destinatarios: { id: string; email: string; nombre: string }[] = [];

    if (event.autorEsAdmin) {
      const dueno = await this.usuarioRepo.findById(event.ticketUsuarioId);
      if (dueno) destinatarios.push({ id: dueno.id, email: dueno.email.value, nombre: dueno.nombre });
    } else {
      const usuarios = await this.usuarioRepo.findAll();
      for (const u of usuarios.filter((u) => u.rol.value === 'admin')) {
        destinatarios.push({ id: u.id, email: u.email.value, nombre: u.nombre });
      }
    }

    const ticketUrl = `${this.appUrl}/soporte/${event.aggregateId}`;
    const textoRecortado = event.texto.length > 200 ? `${event.texto.slice(0, 200)}…` : event.texto;

    for (const destinatario of destinatarios) {
      await this.notificacionService.guardar(
        Notificacion.crear({
          id: uuid(),
          usuarioId: destinatario.id,
          titulo: 'Nuevo mensaje en tu ticket de soporte',
          mensaje: `${event.autorNombre}: "${textoRecortado}"`,
          tipo: 'ticket_mensaje',
        }),
      );

      const bodyHtml = `
        <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">Nuevo mensaje en el ticket "${event.asunto}" 💬</h2>
        <p class="email-text" style="margin:0 0 20px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
          ${event.autorNombre} respondió:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card email-border" style="border:1px solid;margin-bottom:24px;border-radius:12px;">
          <tr>
            <td style="padding:20px 24px;">
              <p class="email-text" style="margin:0;font-size:14px;line-height:1.6;font-style:italic;font-family:'Inter',Arial,sans-serif;">"${textoRecortado}"</p>
            </td>
          </tr>
        </table>
        ${emailButton(ticketUrl, 'Ver el ticket completo')}`;

      const html = renderEmailLayout({
        preheader: `${event.autorNombre} respondió tu ticket "${event.asunto}".`,
        bodyHtml,
      });

      await this.emailSender.send(destinatario.email, `Nuevo mensaje en "${event.asunto}"`, html);
    }
  }
}
