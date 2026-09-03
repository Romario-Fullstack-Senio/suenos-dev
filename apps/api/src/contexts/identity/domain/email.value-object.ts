import { ValueObject, DomainError } from '@suenos-dev/shared-kernel';

interface EmailProps {
  value: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): Email {
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new DomainError(`Email inválido: ${email}`);
    }
    return new Email({ value: email.toLowerCase().trim() });
  }
}
