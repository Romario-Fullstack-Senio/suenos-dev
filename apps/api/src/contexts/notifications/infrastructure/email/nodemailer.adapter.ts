import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from '../../application/email-sender.port';

@Injectable()
export class NodemailerAdapter implements EmailSender {
  private readonly logger = new Logger(NodemailerAdapter.name);

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(
      `[NodemailerAdapter] Simulando envío de email...\n  Para: ${to}\n  Asunto: ${subject}\n  Cuerpo: ${body}`,
    );
  }
}
