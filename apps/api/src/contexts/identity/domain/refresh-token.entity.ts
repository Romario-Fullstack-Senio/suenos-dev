import { AggregateRoot } from '@suenos-dev/shared-kernel';

export interface RefreshTokenProps {
  usuarioId: string;
  tokenHash: string;
  /** Se mantiene igual a través de las rotaciones (ver RefrescarTokenUseCase)
   * — el token en sí cambia en cada refresh, pero todos los de una misma
   * sesión de login comparten este id. Es lo que identifica una "sesión
   * activa" en /perfil, no el id de la fila individual. */
  familyId: string;
  userAgent: string | null;
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

  get familyId(): string {
    return this.props.familyId;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
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

  static crear(
    id: string,
    usuarioId: string,
    tokenHash: string,
    familyId: string,
    userAgent: string | null = null,
    vigenciaDias = 30,
  ): RefreshToken {
    return new RefreshToken(id, {
      usuarioId,
      tokenHash,
      familyId,
      userAgent,
      expira: new Date(Date.now() + vigenciaDias * 24 * 60 * 60 * 1000),
      revocado: false,
    });
  }

  static reconstitute(id: string, props: RefreshTokenProps, createdAt?: Date): RefreshToken {
    const token = new RefreshToken(id, props);
    // Entity's constructor siempre pisa _createdAt con `new Date()` — sin
    // esto, la lista de "sesiones activas" (que ordena por antigüedad real)
    // mostraría todas las filas como creadas "ahora mismo" (mismo bug que
    // ya se había encontrado y arreglado en Orden.restore).
    if (createdAt) {
      Object.defineProperty(token, '_createdAt', { value: createdAt });
    }
    return token;
  }
}
