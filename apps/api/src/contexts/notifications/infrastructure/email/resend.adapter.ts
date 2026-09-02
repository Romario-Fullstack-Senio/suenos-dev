import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from '../../application/email-sender.port';
import { Resend } from 'resend';

@Injectable()
export class ResendAdapter implements EmailSender {
  private readonly logger = new Logger(ResendAdapter.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.EMAIL_FROM || 'noreply@suenos-dev.dev';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log(`Resend configured (from: ${this.from})`);
    } else {
      this.resend = null;
      this.logger.warn('RESEND_API_KEY not set. Emails will be logged only.');
    }
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[EMAIL LOG] To: ${to}\n  Subject: ${subject}\n  ---`);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [to],
        subject,
        html: body,
      });

      if (error) {
        this.logger.error(`Resend error sending to ${to}: ${error.message}`);
        throw new Error(error.message);
      }

      this.logger.log(`Email sent via Resend → ${to} | Subject: "${subject}" | ID: ${data?.id}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email via Resend to ${to}: ${error.message}`);
      throw error;
    }
  }
}
