import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';

interface OrdenReembolsadaEvent {
  estudianteId: string;
  cursoId: string;
  monto: number;
}

@Injectable()
export class EnviarEmailReembolsoHandler {
  private readonly logger = new Logger(EnviarEmailReembolsoHandler.name);

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
  ) {}

  @OnEvent('OrdenReembolsada')
  async handle(event: OrdenReembolsadaEvent) {
    const [usuario, curso] = await Promise.all([
      this.usuarioRepo.findById(event.estudianteId),
      this.cursoRepo.findById(event.cursoId),
    ]);
    if (!usuario) return;

    const cursoNombre = curso?.titulo ?? 'tu curso';
    this.logger.log(`[EMAIL] Enviando confirmación de reembolso a ${usuario.email.value}`);

    const subject = `Reembolso procesado — ${cursoNombre}`;
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🎓 Sueños Dev</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1e293b;margin:0 0 8px;font-size:22px;">Hola, ${usuario.nombre}</h2>
          <p style="color:#64748b;margin:0 0 24px;font-size:15px;line-height:1.6;">
            Procesamos el reembolso de <strong>$${event.monto} USD</strong> por el curso "${cursoNombre}".
            El acceso al curso fue dado de baja. El reembolso puede tardar unos días hábiles en verse
            reflejado en tu método de pago original.
          </p>
        </td></tr>
        <tr><td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;margin:0;font-size:12px;text-align:center;">© 2026 Sueños Dev — Plataforma de E-Learning</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.emailSender.send(usuario.email.value, subject, html);
  }
}
