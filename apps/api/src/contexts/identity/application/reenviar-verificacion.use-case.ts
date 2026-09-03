import { Inject, Injectable } from '@nestjs/common';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../domain/usuario.repository.port';
import { EventBus } from '../../../common/event-bus';
import { UsuarioRegistradoEvent } from '../domain/usuario-registrado.event';
import { AuthProviderTipo } from '../domain/auth-provider.value-object';
import { randomBytes } from 'crypto';

@Injectable()
export class ReenviarVerificacionUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(email: string): Promise<void> {
    const usuario = await this.usuarioRepo.findByEmail(email);
    // Respuesta idéntica exista o no el email / ya esté verificado — evita
    // que este endpoint sirva para enumerar qué emails están registrados.
    if (!usuario || usuario.emailVerificado || usuario.esOAuth) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    usuario.asignarTokenVerificacion(token);
    await this.usuarioRepo.save(usuario);

    await this.eventBus.publish(
      new UsuarioRegistradoEvent(usuario.id, usuario.email.value, usuario.nombre, AuthProviderTipo.LOCAL, token),
    );
  }
}
