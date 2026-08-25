import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EMAIL_SENDER, EmailSender } from '../../application/email-sender.port';

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

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🎓 Sueños Dev</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Plataforma de E-Learning</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;margin:0 0 8px;font-size:22px;">¡Hola, ${destinatarioNombre}! 👋</h2>
              <p style="color:#64748b;margin:0 0 24px;font-size:15px;line-height:1.6;">
                Tenemos un nuevo curso que podría interesarte. ¡No te lo pierdas!
              </p>

              <!-- Course Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Nuevo curso</p>
                    <p style="color:#1e293b;margin:0 0 8px;font-size:20px;font-weight:700;">${cursoTitulo}</p>
                    <p style="color:#64748b;margin:0 0 16px;font-size:14px;line-height:1.6;">${cursoDescripcion}</p>
                    <a href="${this.appUrl}/cursos/${cursoSlug}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
                      Ver curso →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#94a3b8;margin:0;font-size:13px;text-align:center;line-height:1.5;">
                Explora todos nuestros cursos en<br>
                <a href="${this.appUrl}/cursos" style="color:#6366f1;">${this.appUrl}/cursos</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;margin:0;font-size:12px;text-align:center;">
                © 2026 Sueños Dev — Plataforma de E-Learning<br>
                Este es un correo automático, por favor no responder.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
