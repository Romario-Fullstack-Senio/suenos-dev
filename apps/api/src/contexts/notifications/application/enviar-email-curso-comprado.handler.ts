import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';

@Injectable()
export class EnviarEmailCursoCompradoHandler {
  private readonly logger = new Logger(EnviarEmailCursoCompradoHandler.name);

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

  @OnEvent('CursoComprado')
  async handle(cursoComprado: {
    alunoEmail: string;
    cursoNombre: string;
  }) {
    this.logger.log(
      `[EMAIL] Enviando email de curso comprado a ${cursoComprado.alunoEmail} - Curso: ${cursoComprado.cursoNombre}`,
    );

    await this.emailSender.send(
      cursoComprado.alunoEmail,
      'Curso Comprado',
      `Felicitaciones, has comprado el curso: ${cursoComprado.cursoNombre}`,
    );
  }
}
