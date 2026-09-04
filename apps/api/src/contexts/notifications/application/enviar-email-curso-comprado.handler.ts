import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { renderEmailLayout, emailButton, emailInfoCard } from './email-layout';

interface CursoCompradoEvent {
  alumnoEmail: string;
  alumnoNombre: string;
  cursoNombre: string;
  cursoId: string;
  precio: number;
}

@Injectable()
export class EnviarEmailCursoCompradoHandler {
  private readonly logger = new Logger(EnviarEmailCursoCompradoHandler.name);
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

  @OnEvent('CursoComprado')
  async handle(event: CursoCompradoEvent) {
    this.logger.log(
      `[EMAIL] Enviando email de confirmación a ${event.alumnoEmail} — Curso: ${event.cursoNombre}`,
    );

    const subject = `¡Compra confirmada! — ${event.cursoNombre}`;

    const bodyHtml = `
      <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">¡Hola, ${event.alumnoNombre}! 👋</h2>
      <p class="email-text" style="margin:0 0 24px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
        Tu compra se ha procesado correctamente. Ya tenés acceso completo al curso.
      </p>
      ${emailInfoCard({ eyebrow: 'Curso comprado', title: event.cursoNombre, detail: `$${event.precio} USD` })}
      ${emailButton(`${this.appUrl}/aprender/${event.cursoId}`, '▶ Comenzar ahora')}
      <p class="email-muted" style="margin:0;font-size:13px;text-align:center;line-height:1.5;font-family:'Inter',Arial,sans-serif;">
        También podés acceder desde tu panel de estudiante en<br>
        <a href="${this.appUrl}/dashboard" style="color:#6366f1;">${this.appUrl}/dashboard</a>
      </p>`;

    const html = renderEmailLayout({
      preheader: `Tu compra de "${event.cursoNombre}" se procesó correctamente.`,
      headerSubtitle: 'Plataforma de E-Learning',
      bodyHtml,
    });

    await this.emailSender.send(event.alumnoEmail, subject, html);
  }
}
