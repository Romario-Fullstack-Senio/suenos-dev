import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from '../../application/email-sender.port';
import nodemailer from 'nodemailer';
// Tipo importado por nombre: nodemailer 10 publica un mapa de `exports` sin
// condición de tipos, y con `module: node20` el default import ya no sirve
// como namespace en posición de tipo (`nodemailer.Transporter`).
import type { Transporter } from 'nodemailer';

@Injectable()
export class NodemailerAdapter implements EmailSender {
  private readonly logger = new Logger(NodemailerAdapter.name);
  private transporter: Transporter;
  private readonly configured: boolean;

  constructor() {
    this.configured = !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

    if (this.configured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.logger.log(
        `SMTP configured → ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (from: ${process.env.SMTP_FROM})`,
      );
    } else {
      this.logger.warn(
        'SMTP not configured (SMTP_USER/SMTP_PASS missing). Emails will be logged only.',
      );
    }
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    if (!this.configured) {
      this.logger.log(
        `[EMAIL LOG] To: ${to}\n  Subject: ${subject}\n  ---`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html: body,
      });

      this.logger.log(
        `Email sent → ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}
