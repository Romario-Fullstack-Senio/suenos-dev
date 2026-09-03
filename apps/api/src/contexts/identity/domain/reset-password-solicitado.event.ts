import { DomainEvent } from '@suenos-dev/shared-kernel';

export class ResetPasswordSolicitadoEvent implements DomainEvent {
  readonly eventName = 'usuario.reset-password-solicitado';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly email: string;
  readonly nombre: string;
  readonly token: string;

  constructor(aggregateId: string, email: string, nombre: string, token: string) {
    this.aggregateId = aggregateId;
    this.email = email;
    this.nombre = nombre;
    this.token = token;
    this.occurredOn = new Date();
  }
}
