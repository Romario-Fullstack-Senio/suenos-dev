import { ValueObject, DomainError } from '@suenos-dev/shared-kernel';

export enum AuthProviderTipo {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
}

interface AuthProviderProps {
  value: AuthProviderTipo;
}

export class AuthProvider extends ValueObject<AuthProviderProps> {
  private constructor(props: AuthProviderProps) {
    super(props);
  }

  get value(): AuthProviderTipo {
    return this.props.value;
  }

  get esLocal(): boolean {
    return this.props.value === AuthProviderTipo.LOCAL;
  }

  get esOAuth(): boolean {
    return this.props.value !== AuthProviderTipo.LOCAL;
  }

  static local(): AuthProvider {
    return new AuthProvider({ value: AuthProviderTipo.LOCAL });
  }

  static google(): AuthProvider {
    return new AuthProvider({ value: AuthProviderTipo.GOOGLE });
  }

  static github(): AuthProvider {
    return new AuthProvider({ value: AuthProviderTipo.GITHUB });
  }

  static from(value: string): AuthProvider {
    const valid = Object.values(AuthProviderTipo);
    if (!valid.includes(value as AuthProviderTipo)) {
      throw new DomainError(`AuthProvider inválido: ${value}`);
    }
    return new AuthProvider({ value: value as AuthProviderTipo });
  }
}
