import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';

interface ResetPasswordSolicitadoEvent {
  email: string;
  nombre: string;
  token: string;
}

@Injectable()
export class EnviarEmailResetPasswordHandler {
  private readonly logger = new Logger(EnviarEmailResetPasswordHandler.name);
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

  @OnEvent('usuario.reset-password-solicitado')
  async handle(event: ResetPasswordSolicitadoEvent) {
    this.logger.log(`[EMAIL] Enviando recuperación de contraseña a ${event.email}`);

    const resetUrl = `${this.appUrl}/auth/reset-password?token=${event.token}`;
    const subject = 'Recuperá tu contraseña — Sueños Dev';

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
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🎓 Sueños Dev</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;margin:0 0 8px;font-size:22px;">Hola, ${event.nombre}</h2>
              <p style="color:#64748b;margin:0 0 24px;font-size:15px;line-height:1.6;">
                Recibimos una solicitud para restablecer tu contraseña. Si no fuiste vos, podés ignorar este correo — tu contraseña actual sigue siendo válida.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                      Elegir nueva contraseña
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;margin:0;font-size:13px;text-align:center;line-height:1.5;">
                Este enlace vence en 1 hora.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;margin:0;font-size:12px;text-align:center;">
                © 2026 Sueños Dev — Plataforma de E-Learning
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await this.emailSender.send(event.email, subject, html);
  }
}
