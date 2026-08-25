import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../domain/usuario.entity';
import { Email } from '../domain/email.value-object';
import { AuthProviderTipo } from '../domain/auth-provider.value-object';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { v4 as uuid } from 'uuid';

interface LoginConOAuthCommand {
  email: string;
  nombre: string;
  provider: AuthProviderTipo;
  providerId: string;
}

@Injectable()
export class LoginConOAuthUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: LoginConOAuthCommand): Promise<{ token: string; usuario: { id: string; nombre: string; email: string; rol: string } }> {
    const email = Email.create(command.email);

    // Buscar usuario existente por email
    let usuario = await this.usuarioRepo.findByEmail(email.value);

    if (usuario) {
      // Si ya existe, vincular proveedor si no lo tiene
      if (usuario.esOAuth && usuario.authProvider.value !== command.provider) {
        throw new Error('Este email está registrado con otro proveedor de autenticación');
      }
      if (!usuario.esOAuth) {
        usuario.vincularProveedor(command.provider, command.providerId);
        await this.usuarioRepo.save(usuario);
      }
    } else {
      // Crear nuevo usuario desde OAuth
      const id = uuid();
      usuario = Usuario.registrarDesdeOAuth({
        id,
        nombre: command.nombre,
        email,
        provider: command.provider,
        providerId: command.providerId,
      });
      await this.usuarioRepo.save(usuario);
      // Emitir eventos de dominio
      const events = usuario.pullDomainEvents();
      // Los eventos se procesarán por el EventEmitter2 del módulo
    }

    // Generar JWT
    const payload = { sub: usuario.id, email: usuario.email.value, rol: usuario.rol.value };
    const token = this.jwtService.sign(payload);

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email.value,
        rol: usuario.rol.value,
      },
    };
  }
}
