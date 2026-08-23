export const EMAIL_SENDER = 'EMAIL_SENDER';

export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}
