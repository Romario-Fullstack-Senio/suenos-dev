import { AggregateRoot } from '@suenos-dev/shared-kernel';
import { Email } from './email.value-object';
import { Rol } from './rol.value-object';
import { Password } from './password.value-object';

interface UsuarioProps {
  nombre: string;
  email: Email;
  password: Password;
  rol: Rol;
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
    return new Usuario(id, {
      nombre,
      email,
      password,
      rol: rol ?? Rol.estudiante(),
    });
  }

  static reconstitute(id: string, nombre: string, email: Email, password: Password, rol: Rol, createdAt: Date): Usuario {
    const usuario = new Usuario(id, { nombre, email, password, rol });
    Object.defineProperty(usuario, '_createdAt', { value: createdAt });
    return usuario;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get rol(): Rol {
    return this.props.rol;
  }

  async verificarPassword(plain: string): Promise<boolean> {
    return this.props.password.verify(plain);
  }

  cambiarRol(nuevoRol: Rol): void {
    this.props.rol = nuevoRol;
  }
}
