import { Module } from '@nestjs/common';
import { EMAIL_SENDER } from '../../contexts/notifications/application/email-sender.port';
import { NodemailerAdapter } from '../../contexts/notifications/infrastructure/email/nodemailer.adapter';
import { SendGridAdapter } from '../../contexts/notifications/infrastructure/email/sendgrid.adapter';
import { ResendAdapter } from '../../contexts/notifications/infrastructure/email/resend.adapter';

/**
 * Provider de EMAIL_SENDER compartido. Vive en `common/` (no en
 * `notifications/`) porque tanto `identity` (verificación de email, reset de
 * contraseña) como `notifications` (emails transaccionales de curso) lo
 * necesitan, y `notifications.module.ts` ya importa `IdentityModule` —
 * si el provider viviera ahí, `identity` importando `notifications` de
 * vuelta sería una dependencia circular entre módulos.
 */
@Module({
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
  ],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
