import { AggregateRoot } from '@suenos-dev/shared-kernel';
import { Email } from './email.value-object';
import { Rol } from './rol.value-object';
import { Password } from './password.value-object';
import { AuthProvider, AuthProviderTipo } from './auth-provider.value-object';
import { UsuarioRegistradoEvent } from './usuario-registrado.event';

interface UsuarioProps {
  nombre: string;
  email: Email;
  password: Password | null;
  rol: Rol;
  authProvider: AuthProvider;
  providerId: string | null;
}

export class Usuario extends AggregateRoot<string> {
  private props: UsuarioProps;

  private constructor(id: string, props: UsuarioProps) {
    super(id);
    this.props = props;
  }

  static create(id: string, nombre: string, email: Email, password: Password, rol?: Rol): Usuario {
    if (!nombre || nombre.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }
    const usuario = new Usuario(id, {
      nombre,
      email,
      password,
      rol: rol ?? Rol.estudiante(),
      authProvider: AuthProvider.local(),
      providerId: null,
    });
    usuario.addDomainEvent(new UsuarioRegistradoEvent(id, email.value, nombre, AuthProviderTipo.LOCAL));
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
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }
    if (!params.providerId) {
      throw new Error('El providerId es requerido para auth OAuth');
    }
    const usuario = new Usuario(params.id, {
      nombre: params.nombre,
      email: params.email,
      password: null,
      rol: Rol.estudiante(),
      authProvider: AuthProvider.from(params.provider),
      providerId: params.providerId,
    });
    usuario.addDomainEvent(new UsuarioRegistradoEvent(params.id, params.email.value, params.nombre, params.provider));
    return usuario;
  }

  static reconstitute(
    id: string,
    nombre: string,
    email: Email,
    password: Password | null,
    rol: Rol,
    createdAt: Date,
    authProvider?: AuthProvider,
    providerId?: string | null,
  ): Usuario {
    const usuario = new Usuario(id, {
      nombre,
      email,
      password,
      rol,
      authProvider: authProvider ?? AuthProvider.local(),
      providerId: providerId ?? null,
    });
    Object.defineProperty(usuario, '_createdAt', { value: createdAt });
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

  async verificarPassword(plain: string): Promise<boolean> {
    if (!this.props.password) return false;
    return this.props.password.verify(plain);
  }

  cambiarRol(nuevoRol: Rol): void {
    this.props.rol = nuevoRol;
  }

  vincularProveedor(provider: AuthProviderTipo, providerId: string): void {
    if (this.props.authProvider.esOAuth && this.props.authProvider.value !== provider) {
      throw new Error('El usuario ya está vinculado a otro proveedor OAuth');
    }
    this.props.authProvider = AuthProvider.from(provider);
    this.props.providerId = providerId;
  }
}
