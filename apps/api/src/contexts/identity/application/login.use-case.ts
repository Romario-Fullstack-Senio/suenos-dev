import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';

interface LoginCommand {
  email: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: LoginCommand): Promise<{ token: string; usuario: { id: string; nombre: string; email: string; rol: string } }> {
    const usuario = await this.usuarioRepo.findByEmail(command.email);
    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    const valid = await usuario.verificarPassword(command.password);
    if (!valid) {
      throw new Error('Credenciales inválidas');
    }

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
