import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EmailModule } from '../../common/email/email.module';
import { EnviarEmailCursoCompradoHandler } from './application/enviar-email-curso-comprado.handler';
import { EnviarEmailCertificadoHandler } from './application/enviar-email-certificado.handler';
import { EnviarEmailVerificacionHandler } from './application/enviar-email-verificacion.handler';
import { EnviarEmailResetPasswordHandler } from './application/enviar-email-reset-password.handler';
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
    EmailModule,
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
      provide: NOTIFICACION_REPOSITORY,
      useClass: NotificacionTypeOrmRepository,
    },
    NotificacionService,
    EnviarEmailCursoCompradoHandler,
    EnviarEmailCertificadoHandler,
    EnviarEmailVerificacionHandler,
    EnviarEmailResetPasswordHandler,
    NotificarCursoNuevoHandler,
    NotificacionCursoNuevoProcessor,
  ],
  exports: [EmailModule, NOTIFICACION_REPOSITORY, NotificacionService],
})
export class NotificationsModule {}
