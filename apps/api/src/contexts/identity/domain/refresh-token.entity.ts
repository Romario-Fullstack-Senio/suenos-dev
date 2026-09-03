import { AggregateRoot } from '@suenos-dev/shared-kernel';

export interface RefreshTokenProps {
  usuarioId: string;
  tokenHash: string;
  expira: Date;
  revocado: boolean;
}

/** El token en texto plano nunca se persiste — solo su hash (mismo principio
 * que una contraseña: si la tabla se filtra, no sirve para nada por sí sola). */
export class RefreshToken extends AggregateRoot<string> {
  private props: RefreshTokenProps;

  private constructor(id: string, props: RefreshTokenProps) {
    super(id);
    this.props = props;
  }

  get usuarioId(): string {
    return this.props.usuarioId;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get expira(): Date {
    return this.props.expira;
  }

  get revocado(): boolean {
    return this.props.revocado;
  }

  get esValido(): boolean {
    return !this.props.revocado && this.props.expira.getTime() > Date.now();
  }

  revocar(): void {
    this.props.revocado = true;
    this.touch();
  }

  static crear(id: string, usuarioId: string, tokenHash: string, vigenciaDias = 30): RefreshToken {
    return new RefreshToken(id, {
      usuarioId,
      tokenHash,
      expira: new Date(Date.now() + vigenciaDias * 24 * 60 * 60 * 1000),
      revocado: false,
    });
  }

  static reconstitute(id: string, props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(id, props);
  }
}
