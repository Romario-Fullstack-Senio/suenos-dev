import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_SENDER, EmailSender } from './email-sender.port';

@Injectable()
export class EnviarEmailCertificadoHandler {
  private readonly logger = new Logger(EnviarEmailCertificadoHandler.name);

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

  @OnEvent('QuizAprobado')
  async handle(quizAprobado: {
    alumnoEmail: string;
    cursoNombre: string;
    certificadoUrl: string;
  }) {
    this.logger.log(
      `[EMAIL] Enviando certificado a ${quizAprobado.alumnoEmail} - Curso: ${quizAprobado.cursoNombre}`,
    );

    await this.emailSender.send(
      quizAprobado.alumnoEmail,
      'Certificado Aprobado',
      `Felicidades, has aprobado el curso: ${quizAprobado.cursoNombre}. Descarga tu certificado: ${quizAprobado.certificadoUrl}`,
    );
  }
}
