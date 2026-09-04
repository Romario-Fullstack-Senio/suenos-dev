import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';
import { renderEmailLayout } from './email-layout';
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

    const bodyHtml = `
      <h2 class="email-heading" style="margin:0 0 8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">Hola, ${usuario.nombre}</h2>
      <p class="email-text" style="margin:0 0 24px;font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
        Procesamos el reembolso de <strong>$${event.monto} USD</strong> por el curso "${cursoNombre}".
        El acceso al curso fue dado de baja. El reembolso puede tardar unos días hábiles en verse
        reflejado en tu método de pago original.
      </p>`;

    const html = renderEmailLayout({
      preheader: `Reembolso de $${event.monto} USD procesado por "${cursoNombre}".`,
      bodyHtml,
    });

    await this.emailSender.send(usuario.email.value, subject, html);
  }
}
