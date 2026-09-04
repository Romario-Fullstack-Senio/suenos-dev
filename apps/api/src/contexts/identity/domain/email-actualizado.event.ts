import { DomainEvent } from '@suenos-dev/shared-kernel';

/** Mismo payload que UsuarioRegistradoEvent (EnviarEmailVerificacionHandler
 * ya escucha ambos nombres de evento) — la cuenta cambió de email desde
 * /perfil y hay que volver a confirmarlo, igual que al registrarse. */
export class EmailActualizadoEvent implements DomainEvent {
  readonly eventName = 'usuario.email-actualizado';
  readonly occurredOn: Date;

  constructor(
    readonly aggregateId: string,
    readonly email: string,
    readonly nombre: string,
    readonly verificacionToken: string,
  ) {
    this.occurredOn = new Date();
  }
}
