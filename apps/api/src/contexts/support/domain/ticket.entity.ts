import { AggregateRoot, DomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { MensajeTicket } from './mensaje-ticket.entity';
import { TicketCreado } from './events/ticket-creado.event';
import { MensajeTicketCreado } from './events/mensaje-ticket-creado.event';

export type EstadoTicket = 'abierto' | 'en_proceso' | 'cerrado';
export type CategoriaTicket = 'cuenta' | 'pagos' | 'curso' | 'tecnico' | 'otro';

const CATEGORIAS: CategoriaTicket[] = ['cuenta', 'pagos', 'curso', 'tecnico', 'otro'];

interface TicketProps {
  usuarioId: string;
  usuarioNombre: string;
  asunto: string;
  categoria: CategoriaTicket;
  estado: EstadoTicket;
  mensajes: MensajeTicket[];
  createdAt: Date;
}

export class Ticket extends AggregateRoot<string> {
  private props: TicketProps;

  private constructor(id: string, props: TicketProps) {
    super(id);
    this.props = props;
  }

  static crear(
    id: string,
    params: {
      usuarioId: string;
      usuarioNombre: string;
      asunto: string;
      categoria: string;
      mensajeInicialId: string;
      texto: string;
    },
  ): Ticket {
    const asunto = params.asunto?.trim();
    if (!asunto) throw new DomainError('El asunto no puede estar vacío');
    if (asunto.length > 200) throw new DomainError('El asunto es demasiado largo (máx. 200 caracteres)');
    if (!CATEGORIAS.includes(params.categoria as CategoriaTicket)) {
      throw new DomainError('Categoría de ticket inválida');
    }

    const mensajeInicial = MensajeTicket.crear(params.mensajeInicialId, {
      autorId: params.usuarioId,
      autorNombre: params.usuarioNombre,
      autorEsAdmin: false,
      texto: params.texto,
    });

    const ticket = new Ticket(id, {
      usuarioId: params.usuarioId,
      usuarioNombre: params.usuarioNombre,
      asunto,
      categoria: params.categoria as CategoriaTicket,
      estado: 'abierto',
      mensajes: [mensajeInicial],
      createdAt: new Date(),
    });
    ticket.addDomainEvent(new TicketCreado(id, params.usuarioId, params.usuarioNombre, asunto));
    return ticket;
  }

  static reconstitute(id: string, props: TicketProps): Ticket {
    return new Ticket(id, { ...props, mensajes: [...props.mensajes] });
  }

  get usuarioId(): string { return this.props.usuarioId; }
  get usuarioNombre(): string { return this.props.usuarioNombre; }
  get asunto(): string { return this.props.asunto; }
  get categoria(): CategoriaTicket { return this.props.categoria; }
  get estado(): EstadoTicket { return this.props.estado; }
  get mensajes(): MensajeTicket[] { return this.props.mensajes; }
  get createdAt(): Date { return this.props.createdAt; }

  /** Dueño del ticket o admin — nadie más puede ver/responder. */
  verificarAcceso(callerId: string, callerEsAdmin: boolean): void {
    if (!callerEsAdmin && callerId !== this.props.usuarioId) {
      throw new UnauthorizedDomainError('No tenés acceso a este ticket');
    }
  }

  agregarMensaje(mensaje: MensajeTicket): void {
    if (this.props.estado === 'cerrado' && !mensaje.autorEsAdmin) {
      // Un usuario que escribe en un ticket cerrado lo reabre — un admin
      // puede seguir agregando notas aunque esté cerrado sin reabrirlo solo.
      this.props.estado = 'abierto';
    } else if (mensaje.autorEsAdmin && this.props.estado === 'abierto') {
      this.props.estado = 'en_proceso';
    }
    this.props.mensajes.push(mensaje);
    this.touch();
    this.addDomainEvent(
      new MensajeTicketCreado(
        this.id,
        this.props.asunto,
        this.props.usuarioId,
        mensaje.autorId,
        mensaje.autorNombre,
        mensaje.autorEsAdmin,
        mensaje.texto,
      ),
    );
  }

  cambiarEstado(estado: EstadoTicket): void {
    this.props.estado = estado;
    this.touch();
  }
}
