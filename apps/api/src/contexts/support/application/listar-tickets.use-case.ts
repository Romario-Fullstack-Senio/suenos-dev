import { Inject, Injectable } from '@nestjs/common';
import { Ticket, EstadoTicket } from '../domain/ticket.entity';
import { TICKET_REPOSITORY, TicketRepository } from '../domain/ticket.repository.port';

@Injectable()
export class ListarTicketsUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepo: TicketRepository,
  ) {}

  /** Sin `admin: true` devuelve solo los tickets del usuario — el admin ve
   * todos (opcionalmente filtrados por estado). */
  async execute(params: { usuarioId: string; admin: boolean; estado?: EstadoTicket }): Promise<Ticket[]> {
    if (params.admin) {
      return this.ticketRepo.findAll(params.estado);
    }
    return this.ticketRepo.findByUsuarioId(params.usuarioId);
  }
}
