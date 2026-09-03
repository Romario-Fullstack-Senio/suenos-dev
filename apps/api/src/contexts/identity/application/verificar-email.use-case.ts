import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';

@Injectable()
export class VerificarEmailUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(token: string): Promise<void> {
    const usuario = await this.usuarioRepo.findByVerificacionToken(token);
    if (!usuario) {
      throw new NotFoundDomainError('El enlace de verificación no es válido');
    }
    usuario.verificarEmail(token);
    await this.usuarioRepo.save(usuario);
  }
}
