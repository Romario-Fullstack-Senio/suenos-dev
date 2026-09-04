import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EMAIL_SENDER, EmailSender } from '../../application/email-sender.port';
import { renderEmailLayout } from '../../application/email-layout';

export interface EnviarEmailCursoNuevoJob {
  cursoId: string;
  cursoTitulo: string;
  cursoSlug: string;
  cursoDescripcion: string;
  destinatarioEmail: string;
  destinatarioNombre: string;
}

@Processor('curso-nuevo-emails')
export class NotificacionCursoNuevoProcessor {
  private readonly logger = new Logger(NotificacionCursoNuevoProcessor.name);
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

  @Process()
  async handleEnviarEmail(job: Job<EnviarEmailCursoNuevoJob>): Promise<void> {
    const { destinatarioEmail, destinatarioNombre, cursoTitulo, cursoSlug, cursoDescripcion } = job.data;

    this.logger.log(
      `[BULL] Procesando envío #${job.id} → ${destinatarioEmail} | Curso: ${cursoTitulo}`,
    );

    const subject = `Nuevo curso disponible: ${cursoTitulo}`;

    const bodyHtml = `
      <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">¡Hola, ${destinatarioNombre}! 👋</h2>
      <p class="email-text" style="margin:0 0 24px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
        Tenemos un nuevo curso que podría interesarte. ¡No te lo pierdas!
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card email-border" style="border:1px solid;margin-bottom:24px;border-radius:12px;">
        <tr>
          <td style="padding:24px;">
            <p class="email-muted" style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;font-family:'Inter',Arial,sans-serif;">Nuevo curso</p>
            <p class="email-heading" style="margin:0 0 8px;font-size:20px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">${cursoTitulo}</p>
            <p class="email-text" style="margin:0 0 16px;font-size:14px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${cursoDescripcion}</p>
            <a href="${this.appUrl}/cursos/${cursoSlug}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;font-family:'Inter',Arial,sans-serif;">
              Ver curso →
            </a>
          </td>
        </tr>
      </table>
      <p class="email-muted" style="margin:0;font-size:13px;text-align:center;line-height:1.5;font-family:'Inter',Arial,sans-serif;">
        Explorá todos nuestros cursos en<br>
        <a href="${this.appUrl}/cursos" style="color:#6366f1;">${this.appUrl}/cursos</a>
      </p>`;

    const html = renderEmailLayout({
      preheader: `Nuevo curso disponible: ${cursoTitulo}`,
      headerSubtitle: 'Plataforma de E-Learning',
      bodyHtml,
    });

    await this.emailSender.send(destinatarioEmail, subject, html);
  }

  @OnQueueFailed()
  onFailed(job: Job<EnviarEmailCursoNuevoJob>, error: Error): void {
    this.logger.error(
      `[BULL] Job #${job.id} falló (intento ${job.attemptsMade}/${job.opts.attempts}) → ${job.data.destinatarioEmail}: ${error.message}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<EnviarEmailCursoNuevoJob>): void {
    this.logger.log(
      `[BULL] Job #${job.id} completado → ${job.data.destinatarioEmail}`,
    );
  }
}
