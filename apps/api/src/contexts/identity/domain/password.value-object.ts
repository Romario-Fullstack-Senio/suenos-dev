import { ValueObject } from '@suenos-dev/shared-kernel';
import * as bcrypt from 'bcryptjs';

interface PasswordProps {
  hash: string;
}

export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props);
  }

  get hash(): string {
    return this.props.hash;
  }

  static async create(plain: string): Promise<Password> {
    if (plain.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    const hash = await bcrypt.hash(plain, 10);
    return new Password({ hash });
  }

  static fromHash(hash: string): Password {
    return new Password({ hash });
  }

  async verify(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.props.hash);
  }
}
