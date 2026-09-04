import { Ticket, EstadoTicket } from './ticket.entity';

export const TICKET_REPOSITORY = 'TICKET_REPOSITORY';

export interface TicketRepository {
  save(ticket: Ticket): Promise<void>;
  findById(id: string): Promise<Ticket | null>;
  findByUsuarioId(usuarioId: string): Promise<Ticket[]>;
  findAll(estado?: EstadoTicket): Promise<Ticket[]>;
}
