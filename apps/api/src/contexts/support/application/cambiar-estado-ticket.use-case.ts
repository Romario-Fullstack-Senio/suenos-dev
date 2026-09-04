import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError, DomainError } from '@suenos-dev/shared-kernel';
import { EstadoTicket } from '../domain/ticket.entity';
import { TICKET_REPOSITORY, TicketRepository } from '../domain/ticket.repository.port';

const ESTADOS_VALIDOS: EstadoTicket[] = ['abierto', 'en_proceso', 'cerrado'];

@Injectable()
export class CambiarEstadoTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepo: TicketRepository,
  ) {}

  // Solo admin — cambiar el estado a mano (además de los cambios
  // automáticos que ya dispara Ticket.agregarMensaje) es una acción de
  // moderación, no algo que el dueño del ticket deba poder hacer.
  async execute(ticketId: string, estado: string, callerEsAdmin: boolean): Promise<void> {
    if (!callerEsAdmin) throw new UnauthorizedDomainError('Solo un admin puede cambiar el estado del ticket');
    if (!ESTADOS_VALIDOS.includes(estado as EstadoTicket)) {
      throw new DomainError('Estado de ticket inválido');
    }
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundDomainError('Ticket no encontrado');
    ticket.cambiarEstado(estado as EstadoTicket);
    await this.ticketRepo.save(ticket);
  }
}
