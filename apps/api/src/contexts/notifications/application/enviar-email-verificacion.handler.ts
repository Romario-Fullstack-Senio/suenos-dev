import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { renderEmailLayout, emailButton } from './email-layout';

interface UsuarioRegistradoEvent {
  email: string;
  nombre: string;
  verificacionToken?: string;
}

@Injectable()
export class EnviarEmailVerificacionHandler {
  private readonly logger = new Logger(EnviarEmailVerificacionHandler.name);
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

  // Mismo email, dos disparadores: alta de cuenta nueva y cambio de email
  // desde /perfil (ver Usuario.actualizarPerfil) — el payload es idéntico
  // en ambos casos, no hace falta un handler separado.
  @OnEvent('usuario.registrado')
  @OnEvent('usuario.email-actualizado')
  async handle(event: UsuarioRegistradoEvent) {
    // Las cuentas OAuth (Google/GitHub) no traen token — el proveedor ya
    // verificó el email, no hay nada que confirmar por correo.
    if (!event.verificacionToken) return;

    this.logger.log(`[EMAIL] Enviando verificación de email a ${event.email}`);

    const verifyUrl = `${this.appUrl}/auth/verificar-email?token=${event.verificacionToken}`;
    const subject = 'Confirmá tu email — Sueños Dev';

    const bodyHtml = `
      <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">¡Hola, ${event.nombre}! 👋</h2>
      <p class="email-text" style="margin:0 0 24px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
        Gracias por registrarte. Confirmá tu email para activar todas las funciones de tu cuenta.
      </p>
      ${emailButton(verifyUrl, 'Confirmar mi email')}
      <p class="email-muted" style="margin:0;font-size:13px;text-align:center;line-height:1.5;font-family:'Inter',Arial,sans-serif;">
        Este enlace vence en 24 horas. Si no creaste esta cuenta, podés ignorar este correo.
      </p>`;

    const html = renderEmailLayout({
      preheader: 'Confirmá tu email para activar tu cuenta en Sueños Dev.',
      bodyHtml,
    });

    await this.emailSender.send(event.email, subject, html);
  }
}
