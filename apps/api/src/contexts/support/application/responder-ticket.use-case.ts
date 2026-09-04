import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { MensajeTicket } from '../domain/mensaje-ticket.entity';
import { TICKET_REPOSITORY, TicketRepository } from '../domain/ticket.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { EventBus } from '../../../common/event-bus';

interface ResponderTicketCommand {
  ticketId: string;
  callerId: string;
  callerEsAdmin: boolean;
  texto: string;
}

@Injectable()
export class ResponderTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepo: TicketRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ResponderTicketCommand): Promise<void> {
    const ticket = await this.ticketRepo.findById(command.ticketId);
    if (!ticket) throw new NotFoundDomainError('Ticket no encontrado');
    ticket.verificarAcceso(command.callerId, command.callerEsAdmin);

    const caller = await this.usuarioRepo.findById(command.callerId);
    if (!caller) throw new NotFoundDomainError('Usuario no encontrado');

    const mensaje = MensajeTicket.crear(uuid(), {
      autorId: command.callerId,
      autorNombre: caller.nombre,
      autorEsAdmin: command.callerEsAdmin,
      texto: command.texto,
    });
    ticket.agregarMensaje(mensaje);
    await this.ticketRepo.save(ticket);
    for (const event of ticket.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
