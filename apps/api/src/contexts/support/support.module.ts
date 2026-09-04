import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TicketOrmEntity } from './infrastructure/typeorm/ticket.orm-entity';
import { MensajeTicketOrmEntity } from './infrastructure/typeorm/mensaje-ticket.orm-entity';
import { TicketTypeOrmRepository } from './infrastructure/typeorm/ticket.typeorm-repository';
import { TICKET_REPOSITORY } from './domain/ticket.repository.port';
import { CrearTicketUseCase } from './application/crear-ticket.use-case';
import { ResponderTicketUseCase } from './application/responder-ticket.use-case';
import { ListarTicketsUseCase } from './application/listar-tickets.use-case';
import { ObtenerTicketUseCase } from './application/obtener-ticket.use-case';
import { CambiarEstadoTicketUseCase } from './application/cambiar-estado-ticket.use-case';
import { TicketController } from './interfaces/ticket.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketOrmEntity, MensajeTicketOrmEntity]),
    EventEmitterModule.forRoot(),
    IdentityModule,
  ],
  controllers: [TicketController],
  providers: [
    { provide: TICKET_REPOSITORY, useClass: TicketTypeOrmRepository },
    CrearTicketUseCase,
    ResponderTicketUseCase,
    ListarTicketsUseCase,
    ObtenerTicketUseCase,
    CambiarEstadoTicketUseCase,
  ],
})
export class SupportModule {}
