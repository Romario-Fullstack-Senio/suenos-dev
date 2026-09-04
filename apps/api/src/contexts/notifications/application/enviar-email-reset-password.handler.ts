import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { renderEmailLayout, emailButton } from './email-layout';

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

    const bodyHtml = `
      <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">Hola, ${event.nombre}</h2>
      <p class="email-text" style="margin:0 0 24px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
        Recibimos una solicitud para restablecer tu contraseña. Si no fuiste vos, podés ignorar este correo — tu contraseña actual sigue siendo válida.
      </p>
      ${emailButton(resetUrl, 'Elegir nueva contraseña')}
      <p class="email-muted" style="margin:0;font-size:13px;text-align:center;line-height:1.5;font-family:'Inter',Arial,sans-serif;">
        Este enlace vence en 1 hora.
      </p>`;

    const html = renderEmailLayout({
      preheader: 'Elegí una nueva contraseña — el enlace vence en 1 hora.',
      bodyHtml,
    });

    await this.emailSender.send(event.email, subject, html);
  }
}
