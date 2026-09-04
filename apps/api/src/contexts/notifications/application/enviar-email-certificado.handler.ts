import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { renderEmailLayout, emailInfoCard } from './email-layout';

interface QuizAprobadoEvent {
  alumnoEmail: string;
  alumnoNombre: string;
  cursoNombre: string;
  cursoId: string;
  certificadoId: string;
  puntaje: number;
}

@Injectable()
export class EnviarEmailCertificadoHandler {
  private readonly logger = new Logger(EnviarEmailCertificadoHandler.name);
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

  @OnEvent('QuizAprobado')
  async handle(event: QuizAprobadoEvent) {
    this.logger.log(
      `[EMAIL] Enviando certificado a ${event.alumnoEmail} — Curso: ${event.cursoNombre}`,
    );

    const subject = `🎓 ¡Certificado listo! — ${event.cursoNombre}`;
    const certUrl = `${this.appUrl}/certificados`;
    const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(event.cursoNombre)}&organizationName=Suenos+Dev`;

    const bodyHtml = `
      <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">¡Felicitaciones, ${event.alumnoNombre}! 🎉</h2>
      <p class="email-text" style="margin:0 0 24px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
        Has completado exitosamente el curso y aprobado el quiz con un puntaje de
        <strong style="color:#f59e0b;">${event.puntaje}%</strong>.
      </p>
      ${emailInfoCard({ eyebrow: 'Certificado obtenido', title: event.cursoNombre, detail: `Puntaje: ${event.puntaje}% — Aprobado ✓`, accent: '#f59e0b' })}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td align="center" style="padding-bottom:12px;">
            <a href="${certUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;font-family:'Inter',Arial,sans-serif;box-shadow:0 14px 28px -14px rgba(99,102,241,0.6);">
              📜 Ver mi certificado
            </a>
          </td>
        </tr>
        <tr>
          <td align="center">
            <a href="${linkedinUrl}" style="display:inline-block;background-color:#0077b5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:500;font-family:'Inter',Arial,sans-serif;">
              Agregar a LinkedIn
            </a>
          </td>
        </tr>
      </table>
      <p class="email-muted" style="margin:0;font-size:13px;text-align:center;line-height:1.5;font-family:'Inter',Arial,sans-serif;">
        Tu certificado es verificable de forma pública.<br>
        Podés compartirlo y descargarlo en formato PDF.
      </p>`;

    const html = renderEmailLayout({
      preheader: `¡Aprobaste "${event.cursoNombre}" con ${event.puntaje}%! Tu certificado ya está listo.`,
      headerSubtitle: 'Certificado de Completación',
      bodyHtml,
    });

    await this.emailSender.send(event.alumnoEmail, subject, html);
  }
}
