import { Entity, DomainError } from '@suenos-dev/shared-kernel';

interface MensajeTicketProps {
  autorId: string;
  autorNombre: string;
  autorEsAdmin: boolean;
  texto: string;
  createdAt: Date;
}

export class MensajeTicket extends Entity<string> {
  private props: MensajeTicketProps;

  private constructor(id: string, props: MensajeTicketProps) {
    super(id);
    this.props = props;
  }

  static crear(id: string, params: { autorId: string; autorNombre: string; autorEsAdmin: boolean; texto: string }): MensajeTicket {
    const texto = params.texto?.trim();
    if (!texto) throw new DomainError('El mensaje no puede estar vacío');
    if (texto.length > 3000) throw new DomainError('El mensaje es demasiado largo (máx. 3000 caracteres)');
    return new MensajeTicket(id, {
      autorId: params.autorId,
      autorNombre: params.autorNombre,
      autorEsAdmin: params.autorEsAdmin,
      texto,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: MensajeTicketProps): MensajeTicket {
    return new MensajeTicket(id, { ...props });
  }

  get autorId(): string { return this.props.autorId; }
  get autorNombre(): string { return this.props.autorNombre; }
  get autorEsAdmin(): boolean { return this.props.autorEsAdmin; }
  get texto(): string { return this.props.texto; }
  get createdAt(): Date { return this.props.createdAt; }
}
