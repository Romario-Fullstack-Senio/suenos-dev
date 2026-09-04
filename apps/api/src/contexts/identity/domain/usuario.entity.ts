import { AggregateRoot, DomainError, ConflictDomainError } from '@suenos-dev/shared-kernel';
import { Email } from './email.value-object';
import { Rol } from './rol.value-object';
import { Password } from './password.value-object';
import { AuthProvider, AuthProviderTipo } from './auth-provider.value-object';
import { UsuarioRegistradoEvent } from './usuario-registrado.event';
import { ResetPasswordSolicitadoEvent } from './reset-password-solicitado.event';
import { EmailActualizadoEvent } from './email-actualizado.event';

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
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  twoFactorBackupCodes: string[] | null;
  avatarUrl: string | null;
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
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorBackupCodes: null,
      avatarUrl: null,
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
    avatarUrl?: string | null;
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
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorBackupCodes: null,
      avatarUrl: params.avatarUrl ?? null,
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
      twoFactorSecret?: string | null;
      twoFactorEnabled?: boolean;
      twoFactorBackupCodes?: string[] | null;
      avatarUrl?: string | null;
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
      twoFactorSecret: props.twoFactorSecret ?? null,
      twoFactorEnabled: props.twoFactorEnabled ?? false,
      twoFactorBackupCodes: props.twoFactorBackupCodes ?? null,
      avatarUrl: props.avatarUrl ?? null,
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

  get twoFactorSecret(): string | null {
    return this.props.twoFactorSecret;
  }

  get twoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled;
  }

  get twoFactorBackupCodes(): string[] | null {
    return this.props.twoFactorBackupCodes;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  async verificarPassword(plain: string): Promise<boolean> {
    if (!this.props.password) return false;
    return this.props.password.verify(plain);
  }

  cambiarRol(nuevoRol: Rol): void {
    this.props.rol = nuevoRol;
  }

  /** El caso de uso ya validó que el nuevo email (si cambió) no esté en
   * uso por otra cuenta — acá solo la regla de dominio del nombre. Si el
   * email SÍ cambió, la cuenta vuelve a quedar sin verificar (nadie
   * confirmó todavía que ese buzón es del dueño de la cuenta) y se dispara
   * un nuevo email de verificación con `nuevoVerificacionToken` — generado
   * por el caso de uso, mismo criterio que asignarTokenVerificacion(). Las
   * cuentas OAuth no reciben este reset: el proveedor sigue siendo dueño
   * de la verificación de esa dirección, cambiarla acá ni siquiera debería
   * pasar en la práctica (el email de una cuenta OAuth no es editable
   * desde el formulario), pero por las dudas no la des-verifica. */
  actualizarPerfil(nombre: string, email: Email, nuevoVerificacionToken?: string): void {
    if (!nombre || nombre.trim().length < 2) {
      throw new DomainError('El nombre debe tener al menos 2 caracteres');
    }
    const cambioEmail = email.value !== this.props.email.value;
    this.props.nombre = nombre.trim();
    this.props.email = email;

    if (cambioEmail && !this.props.authProvider.esOAuth) {
      this.props.emailVerificado = false;
      if (nuevoVerificacionToken) {
        this.asignarTokenVerificacion(nuevoVerificacionToken);
        this.addDomainEvent(
          new EmailActualizadoEvent(this.id, email.value, this.props.nombre, nuevoVerificacionToken),
        );
      }
    }
    this.touch();
  }

  actualizarAvatar(url: string | null): void {
    this.props.avatarUrl = url;
    this.touch();
  }

  /** OAuth (Google/GitHub) puede traer una foto de perfil en cada login —
   * la usamos solo para completar el avatar si el usuario todavía no
   * subió/eligió uno propio, nunca para pisar una elección manual. */
  actualizarAvatarDesdeOAuthSiVacio(url: string | null): void {
    if (!url || this.props.avatarUrl) return;
    this.props.avatarUrl = url;
    this.touch();
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

  /** Guarda el secreto TOTP recién generado, todavía sin activar — el
   * usuario tiene que confirmarlo escaneando el QR y mandando un código
   * válido (confirmarActivacionDosFactores) antes de que 2FA empiece a
   * exigirse en el login. Así un secreto generado pero nunca confirmado
   * (usuario cerró la pantalla a mitad de camino) no deja la cuenta
   * inaccesible. */
  iniciarConfiguracionDosFactores(secret: string): void {
    if (this.props.twoFactorEnabled) {
      throw new DomainError('La verificación en dos pasos ya está activada — desactivala antes de reconfigurar');
    }
    this.props.twoFactorSecret = secret;
    this.touch();
  }

  confirmarActivacionDosFactores(codigosRespaldoHasheados: string[]): void {
    if (!this.props.twoFactorSecret) {
      throw new DomainError('Primero tenés que iniciar la configuración de la verificación en dos pasos');
    }
    this.props.twoFactorEnabled = true;
    this.props.twoFactorBackupCodes = codigosRespaldoHasheados;
    this.touch();
  }

  desactivarDosFactores(): void {
    this.props.twoFactorSecret = null;
    this.props.twoFactorEnabled = false;
    this.props.twoFactorBackupCodes = null;
    this.touch();
  }

  /** Consume un código de respaldo (de un solo uso) si es válido — el hash
   * ya viene calculado por el caso de uso, acá solo se compara y se saca
   * de la lista para que no pueda reusarse. */
  consumirCodigoRespaldo(codigoHasheado: string): boolean {
    if (!this.props.twoFactorBackupCodes) return false;
    const index = this.props.twoFactorBackupCodes.indexOf(codigoHasheado);
    if (index === -1) return false;
    this.props.twoFactorBackupCodes = this.props.twoFactorBackupCodes.filter((_, i) => i !== index);
    this.touch();
    return true;
  }

  vincularProveedor(provider: AuthProviderTipo, providerId: string): void {
    if (this.props.authProvider.esOAuth && this.props.authProvider.value !== provider) {
      throw new ConflictDomainError('El usuario ya está vinculado a otro proveedor OAuth');
    }
    this.props.authProvider = AuthProvider.from(provider);
    this.props.providerId = providerId;
  }
}
