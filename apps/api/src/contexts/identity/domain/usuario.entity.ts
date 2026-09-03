import { AggregateRoot, DomainError, ConflictDomainError } from '@suenos-dev/shared-kernel';
import { Email } from './email.value-object';
import { Rol } from './rol.value-object';
import { Password } from './password.value-object';
import { AuthProvider, AuthProviderTipo } from './auth-provider.value-object';
import { UsuarioRegistradoEvent } from './usuario-registrado.event';
import { ResetPasswordSolicitadoEvent } from './reset-password-solicitado.event';

interface UsuarioProps {
  nombre: string;
  email: Email;
  password: Password | null;
  rol: Rol;
  authProvider: AuthProvider;
  providerId: string | null;
  emailVerificado: boolean;
  verificacionToken: string | null;
  verificacionTokenExpira: Date | null;
  resetPasswordToken: string | null;
  resetPasswordExpira: Date | null;
}

export class Usuario extends AggregateRoot<string> {
  private props: UsuarioProps;

  private constructor(id: string, props: UsuarioProps) {
    super(id);
    this.props = props;
  }

  static create(
    id: string,
    nombre: string,
    email: Email,
    password: Password,
    rol?: Rol,
    verificacionToken?: string,
  ): Usuario {
    if (!nombre || nombre.length < 2) {
      throw new DomainError('El nombre debe tener al menos 2 caracteres');
    }
    const usuario = new Usuario(id, {
      nombre,
      email,
      password,
      rol: rol ?? Rol.estudiante(),
      authProvider: AuthProvider.local(),
      providerId: null,
      emailVerificado: false,
      verificacionToken: verificacionToken ?? null,
      verificacionTokenExpira: verificacionToken ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      resetPasswordToken: null,
      resetPasswordExpira: null,
    });
    usuario.addDomainEvent(
      new UsuarioRegistradoEvent(id, email.value, nombre, AuthProviderTipo.LOCAL, verificacionToken),
    );
    return usuario;
  }

  static registrarDesdeOAuth(params: {
    id: string;
    nombre: string;
    email: Email;
    provider: AuthProviderTipo;
    providerId: string;
  }): Usuario {
    if (!params.nombre || params.nombre.length < 2) {
      throw new DomainError('El nombre debe tener al menos 2 caracteres');
    }
    if (!params.providerId) {
      throw new DomainError('El providerId es requerido para auth OAuth');
    }
    const usuario = new Usuario(params.id, {
      nombre: params.nombre,
      email: params.email,
      password: null,
      rol: Rol.estudiante(),
      authProvider: AuthProvider.from(params.provider),
      providerId: params.providerId,
      // El proveedor OAuth (Google/GitHub) ya confirmó la propiedad del email
      // antes de devolvernos el perfil — no hace falta nuestro propio flujo
      // de verificación.
      emailVerificado: true,
      verificacionToken: null,
      verificacionTokenExpira: null,
      resetPasswordToken: null,
      resetPasswordExpira: null,
    });
    usuario.addDomainEvent(new UsuarioRegistradoEvent(params.id, params.email.value, params.nombre, params.provider));
    return usuario;
  }

  static reconstitute(
    id: string,
    props: {
      nombre: string;
      email: Email;
      password: Password | null;
      rol: Rol;
      createdAt: Date;
      authProvider?: AuthProvider;
      providerId?: string | null;
      emailVerificado?: boolean;
      verificacionToken?: string | null;
      verificacionTokenExpira?: Date | null;
      resetPasswordToken?: string | null;
      resetPasswordExpira?: Date | null;
    },
  ): Usuario {
    const usuario = new Usuario(id, {
      nombre: props.nombre,
      email: props.email,
      password: props.password,
      rol: props.rol,
      authProvider: props.authProvider ?? AuthProvider.local(),
      providerId: props.providerId ?? null,
      emailVerificado: props.emailVerificado ?? false,
      verificacionToken: props.verificacionToken ?? null,
      verificacionTokenExpira: props.verificacionTokenExpira ?? null,
      resetPasswordToken: props.resetPasswordToken ?? null,
      resetPasswordExpira: props.resetPasswordExpira ?? null,
    });
    Object.defineProperty(usuario, '_createdAt', { value: props.createdAt });
    return usuario;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password | null {
    return this.props.password;
  }

  get rol(): Rol {
    return this.props.rol;
  }

  get authProvider(): AuthProvider {
    return this.props.authProvider;
  }

  get providerId(): string | null {
    return this.props.providerId;
  }

  get esOAuth(): boolean {
    return this.props.authProvider.esOAuth;
  }

  get emailVerificado(): boolean {
    return this.props.emailVerificado;
  }

  get verificacionToken(): string | null {
    return this.props.verificacionToken;
  }

  get verificacionTokenExpira(): Date | null {
    return this.props.verificacionTokenExpira;
  }

  get resetPasswordToken(): string | null {
    return this.props.resetPasswordToken;
  }

  get resetPasswordExpira(): Date | null {
    return this.props.resetPasswordExpira;
  }

  async verificarPassword(plain: string): Promise<boolean> {
    if (!this.props.password) return false;
    return this.props.password.verify(plain);
  }

  cambiarRol(nuevoRol: Rol): void {
    this.props.rol = nuevoRol;
  }

  /** El token en sí lo genera el caso de uso (capa de aplicación); acá solo
   * se asigna y se define su vencimiento. */
  asignarTokenVerificacion(token: string, vigenciaHoras = 24): void {
    this.props.verificacionToken = token;
    this.props.verificacionTokenExpira = new Date(Date.now() + vigenciaHoras * 60 * 60 * 1000);
    this.touch();
  }

  verificarEmail(token: string): void {
    if (this.props.emailVerificado) return; // idempotente
    if (!this.props.verificacionToken || this.props.verificacionToken !== token) {
      throw new DomainError('El enlace de verificación no es válido');
    }
    if (!this.props.verificacionTokenExpira || this.props.verificacionTokenExpira.getTime() < Date.now()) {
      throw new DomainError('El enlace de verificación expiró, solicitá uno nuevo');
    }
    this.props.emailVerificado = true;
    this.props.verificacionToken = null;
    this.props.verificacionTokenExpira = null;
    this.touch();
  }

  asignarTokenResetPassword(token: string, vigenciaHoras = 1): void {
    this.props.resetPasswordToken = token;
    this.props.resetPasswordExpira = new Date(Date.now() + vigenciaHoras * 60 * 60 * 1000);
    this.touch();
    this.addDomainEvent(
      new ResetPasswordSolicitadoEvent(this.id, this.props.email.value, this.props.nombre, token),
    );
  }

  async resetearPassword(token: string, nuevaPasswordPlain: string): Promise<void> {
    if (!this.props.resetPasswordToken || this.props.resetPasswordToken !== token) {
      throw new DomainError('El enlace de recuperación no es válido');
    }
    if (!this.props.resetPasswordExpira || this.props.resetPasswordExpira.getTime() < Date.now()) {
      throw new DomainError('El enlace de recuperación expiró, solicitá uno nuevo');
    }
    this.props.password = await Password.create(nuevaPasswordPlain);
    this.props.resetPasswordToken = null;
    this.props.resetPasswordExpira = null;
    this.touch();
  }

  vincularProveedor(provider: AuthProviderTipo, providerId: string): void {
    if (this.props.authProvider.esOAuth && this.props.authProvider.value !== provider) {
      throw new ConflictDomainError('El usuario ya está vinculado a otro proveedor OAuth');
    }
    this.props.authProvider = AuthProvider.from(provider);
    this.props.providerId = providerId;
  }
}
