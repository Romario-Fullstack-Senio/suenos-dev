import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { Ticket } from '../domain/ticket.entity';
import { TICKET_REPOSITORY, TicketRepository } from '../domain/ticket.repository.port';

@Injectable()
export class ObtenerTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepo: TicketRepository,
  ) {}

  async execute(ticketId: string, callerId: string, callerEsAdmin: boolean): Promise<Ticket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundDomainError('Ticket no encontrado');
    ticket.verificarAcceso(callerId, callerEsAdmin);
    return ticket;
  }
}
