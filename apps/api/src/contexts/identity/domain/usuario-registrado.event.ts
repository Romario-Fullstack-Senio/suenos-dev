import { DomainEvent } from '@suenos-dev/shared-kernel';
import { AuthProviderTipo } from './auth-provider.value-object';

export class UsuarioRegistradoEvent implements DomainEvent {
  readonly eventName = 'usuario.registrado';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly email: string;
  readonly nombre: string;
  readonly authProvider: AuthProviderTipo;
  readonly verificacionToken?: string;

  constructor(
    aggregateId: string,
    email: string,
    nombre: string,
    authProvider: AuthProviderTipo,
    verificacionToken?: string,
  ) {
    this.aggregateId = aggregateId;
    this.email = email;
    this.nombre = nombre;
    this.authProvider = authProvider;
    this.verificacionToken = verificacionToken;
    this.occurredOn = new Date();
  }
}
