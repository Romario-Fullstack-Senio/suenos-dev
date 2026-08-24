import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';

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
            <td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🎓 Sueños Dev</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Certificado de Completación</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;margin:0 0 8px;font-size:22px;">¡Felicitaciones, ${event.alumnoNombre}! 🎉</h2>
              <p style="color:#64748b;margin:0 0 24px;font-size:15px;line-height:1.6;">
                Has completado exitosamente el curso y aprobado el quiz con un puntaje de
                <strong style="color:#059669;">${event.puntaje}%</strong>.
              </p>

              <!-- Certificate Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:2px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Certificado obtenido</p>
                    <p style="color:#1e293b;margin:0 0 8px;font-size:18px;font-weight:600;">${event.cursoNombre}</p>
                    <p style="color:#059669;margin:0;font-size:14px;font-weight:500;">Puntaje: ${event.puntaje}% — Aprobado ✓</p>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${certUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                      📜 Ver mi certificado
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${linkedinUrl}" style="display:inline-block;background-color:#0077b5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;">
                      Agregar a LinkedIn
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#94a3b8;margin:0;font-size:13px;text-align:center;line-height:1.5;">
                Tu certificado es verificable de forma pública.<br>
                Puedes compartirlo y descargarlo en formato PDF.
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

    await this.emailSender.send(event.alumnoEmail, subject, html);
  }
}
