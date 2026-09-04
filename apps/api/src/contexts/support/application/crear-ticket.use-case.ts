import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { Ticket } from '../domain/ticket.entity';
import { TICKET_REPOSITORY, TicketRepository } from '../domain/ticket.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { EventBus } from '../../../common/event-bus';

interface CrearTicketCommand {
  usuarioId: string;
  asunto: string;
  categoria: string;
  texto: string;
}

@Injectable()
export class CrearTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepo: TicketRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CrearTicketCommand): Promise<Ticket> {
    const usuario = await this.usuarioRepo.findById(command.usuarioId);
    if (!usuario) throw new NotFoundDomainError('Usuario no encontrado');

    const ticket = Ticket.crear(uuid(), {
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      asunto: command.asunto,
      categoria: command.categoria,
      mensajeInicialId: uuid(),
      texto: command.texto,
    });
    await this.ticketRepo.save(ticket);
    for (const event of ticket.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
    return ticket;
  }
}
