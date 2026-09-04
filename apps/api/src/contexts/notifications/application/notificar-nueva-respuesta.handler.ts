import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { NotificacionService } from './notificacion.service';
import { Notificacion } from '../domain/notificacion.entity';
import { renderEmailLayout, emailButton } from './email-layout';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

interface RespuestaCreadaEvent {
  aggregateId: string;
  preguntaId: string;
  cursoId: string;
  leccionId: string;
  leccionTitulo: string;
  cursoTitulo: string;
  preguntaAutorId: string;
  respuestaAutorId: string;
  respuestaAutorNombre: string;
  respuestaAutorEsInstructor: boolean;
  texto: string;
}

/** Avisa al autor de la pregunta original que alguien (instructor u otro
 * alumno) la respondió — in-app + email. */
@Injectable()
export class NotificarNuevaRespuestaHandler {
  private readonly logger = new Logger(NotificarNuevaRespuestaHandler.name);
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly notificacionService: NotificacionService,
  ) {}

  @OnEvent('RespuestaCreada')
  async handle(event: RespuestaCreadaEvent): Promise<void> {
    this.logger.log(
      `[EVENT] RespuestaCreada recibida en pregunta ${event.preguntaId} — notificando a autor ${event.preguntaAutorId}`,
    );

    const quien = event.respuestaAutorEsInstructor ? 'El instructor' : event.respuestaAutorNombre;

    const notificacion = Notificacion.crear({
      id: uuid(),
      usuarioId: event.preguntaAutorId,
      titulo: 'Respondieron tu pregunta',
      mensaje: `${quien} respondió tu pregunta en "${event.leccionTitulo}" (${event.cursoTitulo})`,
      tipo: 'respuesta_nueva',
      cursoId: event.cursoId,
    });
    await this.notificacionService.guardar(notificacion);

    const autorPregunta = await this.usuarioRepo.findById(event.preguntaAutorId);
    if (!autorPregunta) return;

    const leccionUrl = `${this.appUrl}/aprender/${event.cursoId}`;
    const textoRecortado = event.texto.length > 200 ? `${event.texto.slice(0, 200)}…` : event.texto;

    const bodyHtml = `
      <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">¡Respondieron tu pregunta! 💬</h2>
      <p class="email-text" style="margin:0 0 20px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
        ${quien} respondió tu pregunta en la lección "${event.leccionTitulo}" de <strong>${event.cursoTitulo}</strong>:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card email-border" style="border:1px solid;margin-bottom:24px;border-radius:12px;">
        <tr>
          <td style="padding:20px 24px;">
            <p class="email-text" style="margin:0;font-size:14px;line-height:1.6;font-style:italic;font-family:'Inter',Arial,sans-serif;">"${textoRecortado}"</p>
          </td>
        </tr>
      </table>
      ${emailButton(leccionUrl, 'Ver la respuesta completa')}`;

    const html = renderEmailLayout({
      preheader: `${quien} respondió tu pregunta en "${event.leccionTitulo}".`,
      bodyHtml,
    });

    await this.emailSender.send(autorPregunta.email.value, `Respondieron tu pregunta en "${event.cursoTitulo}"`, html);
  }
}
