import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EMAIL_SENDER } from './application/email-sender.port';
import { NodemailerAdapter } from './infrastructure/email/nodemailer.adapter';
import { SendGridAdapter } from './infrastructure/email/sendgrid.adapter';
import { ResendAdapter } from './infrastructure/email/resend.adapter';
import { EnviarEmailCursoCompradoHandler } from './application/enviar-email-curso-comprado.handler';
import { EnviarEmailCertificadoHandler } from './application/enviar-email-certificado.handler';
import { NotificarCursoNuevoHandler } from './application/notificar-curso-nuevo.handler';
import { NotificacionService } from './application/notificacion.service';
import { NotificacionCursoNuevoProcessor } from './infrastructure/queue/notificacion-curso-nuevo.processor';
import { NotificacionOrmEntity } from './infrastructure/typesorm/notificacion.orm-entity';
import { NotificacionTypeOrmRepository } from './infrastructure/typesorm/notificacion.typeorm-repository';
import { NOTIFICACION_REPOSITORY } from './domain/notificacion.repository.port';
import { NotificacionesController } from './interfaces/notificaciones.controller';
import { IdentityModule } from '../identity/identity.module';

const QUEUE_NAME = 'curso-nuevo-emails';

@Module({
  imports: [
    IdentityModule,
    TypeOrmModule.forFeature([NotificacionOrmEntity]),
    BullModule.registerQueue({
      name: QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  controllers: [NotificacionesController],
  providers: [
    {
      provide: EMAIL_SENDER,
      useFactory: () => {
        if (process.env.RESEND_API_KEY) {
          return new ResendAdapter();
        }
        if (process.env.SENDGRID_API_KEY) {
          return new SendGridAdapter();
        }
        return new NodemailerAdapter();
      },
    },
    {
      provide: NOTIFICACION_REPOSITORY,
      useClass: NotificacionTypeOrmRepository,
    },
    NotificacionService,
    EnviarEmailCursoCompradoHandler,
    EnviarEmailCertificadoHandler,
    NotificarCursoNuevoHandler,
    NotificacionCursoNuevoProcessor,
  ],
  exports: [EMAIL_SENDER, NOTIFICACION_REPOSITORY, NotificacionService],
})
export class NotificationsModule {}
