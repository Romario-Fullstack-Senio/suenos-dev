import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';

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
              <h2 style="color:#1e293b;margin:0 0 8px;font-size:22px;">¡Hola, ${event.alumnoNombre}! 👋</h2>
              <p style="color:#64748b;margin:0 0 24px;font-size:15px;line-height:1.6;">
                Tu compra se ha procesado correctamente. Ya tienes acceso completo al curso.
              </p>

              <!-- Course Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Curso comprado</p>
                    <p style="color:#1e293b;margin:0 0 8px;font-size:18px;font-weight:600;">${event.cursoNombre}</p>
                    <p style="color:#6366f1;margin:0;font-size:20px;font-weight:700;">$${event.precio} USD</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${this.appUrl}/aprender/${event.cursoId}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                      ▶ Comenzar ahora
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#94a3b8;margin:0;font-size:13px;text-align:center;line-height:1.5;">
                También puedes acceder desde tu panel de estudiante en<br>
                <a href="${this.appUrl}/dashboard" style="color:#6366f1;">${this.appUrl}/dashboard</a>
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
