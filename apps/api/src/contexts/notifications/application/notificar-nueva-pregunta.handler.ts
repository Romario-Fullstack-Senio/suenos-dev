import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { NotificacionService } from './notificacion.service';
import { Notificacion } from '../domain/notificacion.entity';
import { renderEmailLayout, emailButton } from './email-layout';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

interface PreguntaCreadaEvent {
  aggregateId: string;
  cursoId: string;
  leccionId: string;
  leccionTitulo: string;
  cursoTitulo: string;
  instructorId: string;
  autorId: string;
  autorNombre: string;
  texto: string;
}

/** Avisa al instructor dueño del curso que un alumno dejó una pregunta
 * nueva en una de sus lecciones — in-app + email. */
@Injectable()
export class NotificarNuevaPreguntaHandler {
  private readonly logger = new Logger(NotificarNuevaPreguntaHandler.name);
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly notificacionService: NotificacionService,
  ) {}

  @OnEvent('PreguntaCreada')
  async handle(event: PreguntaCreadaEvent): Promise<void> {
    this.logger.log(
      `[EVENT] PreguntaCreada recibida en "${event.leccionTitulo}" (${event.cursoTitulo}) — notificando a instructor ${event.instructorId}`,
    );

    const notificacion = Notificacion.crear({
      id: uuid(),
      usuarioId: event.instructorId,
      titulo: 'Nueva pregunta de un alumno',
      mensaje: `${event.autorNombre} preguntó sobre "${event.leccionTitulo}" en ${event.cursoTitulo}`,
      tipo: 'pregunta_nueva',
      cursoId: event.cursoId,
    });
    await this.notificacionService.guardar(notificacion);

    const instructor = await this.usuarioRepo.findById(event.instructorId);
    if (!instructor) return;

    const leccionUrl = `${this.appUrl}/aprender/${event.cursoId}`;
    const textoRecortado = event.texto.length > 200 ? `${event.texto.slice(0, 200)}…` : event.texto;

    const bodyHtml = `
      <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">Nueva pregunta en tu curso</h2>
      <p class="email-text" style="margin:0 0 20px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
        <strong>${event.autorNombre}</strong> dejó una pregunta en la lección "${event.leccionTitulo}" de <strong>${event.cursoTitulo}</strong>:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card email-border" style="border:1px solid;margin-bottom:24px;border-radius:12px;">
        <tr>
          <td style="padding:20px 24px;">
            <p class="email-text" style="margin:0;font-size:14px;line-height:1.6;font-style:italic;font-family:'Inter',Arial,sans-serif;">"${textoRecortado}"</p>
          </td>
        </tr>
      </table>
      ${emailButton(leccionUrl, 'Responder en la plataforma')}`;

    const html = renderEmailLayout({
      preheader: `${event.autorNombre} preguntó en "${event.leccionTitulo}".`,
      bodyHtml,
    });

    await this.emailSender.send(instructor.email.value, `Nueva pregunta en "${event.cursoTitulo}"`, html);
  }
}
