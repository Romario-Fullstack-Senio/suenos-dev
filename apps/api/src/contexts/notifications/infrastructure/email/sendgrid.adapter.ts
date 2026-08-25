import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from '../../application/email-sender.port';
import sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridAdapter implements EmailSender {
  private readonly logger = new Logger(SendGridAdapter.name);
  private readonly configured: boolean;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.configured = true;
      this.logger.log('SendGrid configured for production email');
    } else {
      this.configured = false;
      this.logger.warn('SENDGRID_API_KEY not set. Emails will be logged only.');
    }
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    if (!this.configured) {
      this.logger.log(`[EMAIL LOG] To: ${to}\n  Subject: ${subject}\n  ---`);
      return;
    }

    try {
      await sgMail.send({
        to,
        from: process.env.SMTP_FROM || 'noreply@suenosdev.com',
        subject,
        html: body,
      });

      this.logger.log(`Email sent via SendGrid → ${to} | Subject: "${subject}"`);
    } catch (error: any) {
      this.logger.error(`Failed to send email via SendGrid to ${to}: ${error.message}`);
      if (error.response?.body?.errors) {
        this.logger.error(`SendGrid errors: ${JSON.stringify(error.response.body.errors)}`);
      }
    }
  }
}
