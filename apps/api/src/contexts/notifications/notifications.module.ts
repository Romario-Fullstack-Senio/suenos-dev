import { Module } from '@nestjs/common';
import { EMAIL_SENDER } from './application/email-sender.port';
import { NodemailerAdapter } from './infrastructure/email/nodemailer.adapter';
import { EnviarEmailCursoCompradoHandler } from './application/enviar-email-curso-comprado.handler';
import { EnviarEmailCertificadoHandler } from './application/enviar-email-certificado.handler';

@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: NodemailerAdapter,
    },
    EnviarEmailCursoCompradoHandler,
    EnviarEmailCertificadoHandler,
  ],
  exports: [EMAIL_SENDER],
})
export class NotificationsModule {}
