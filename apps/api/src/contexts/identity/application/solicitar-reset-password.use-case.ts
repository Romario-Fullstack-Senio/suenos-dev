import { Inject, Injectable } from '@nestjs/common';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { EventBus } from '../../../common/event-bus';
import { randomBytes } from 'crypto';

@Injectable()
export class SolicitarResetPasswordUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(email: string): Promise<void> {
    const usuario = await this.usuarioRepo.findByEmail(email);
    // Misma respuesta exista o no el email, y para cuentas OAuth (no tienen
    // contraseña que resetear) — evita enumerar emails registrados.
    if (!usuario || usuario.esOAuth) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    usuario.asignarTokenResetPassword(token);
    await this.usuarioRepo.save(usuario);

    for (const event of usuario.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
