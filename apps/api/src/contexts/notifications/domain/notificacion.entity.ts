import { Entity } from '@suenos-dev/shared-kernel';

interface NotificacionProps {
  usuarioId: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  cursoId: string | null;
  leida: boolean;
  createdAt: Date;
}

export class Notificacion extends Entity<string> {
  private props: NotificacionProps;

  private constructor(id: string, props: NotificacionProps) {
    super(id);
    this.props = props;
  }

  static crear(params: {
    id: string;
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: string;
    cursoId?: string;
  }): Notificacion {
    return new Notificacion(params.id, {
      usuarioId: params.usuarioId,
      titulo: params.titulo,
      mensaje: params.mensaje,
      tipo: params.tipo,
      cursoId: params.cursoId ?? null,
      leida: false,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: NotificacionProps): Notificacion {
    return new Notificacion(id, { ...props });
  }

  get usuarioId(): string { return this.props.usuarioId; }
  get titulo(): string { return this.props.titulo; }
  get mensaje(): string { return this.props.mensaje; }
  get tipo(): string { return this.props.tipo; }
  get cursoId(): string | null { return this.props.cursoId; }
  get leida(): boolean { return this.props.leida; }
  get createdAt(): Date { return this.props.createdAt; }

  marcarLeida(): void {
    this.props.leida = true;
  }
}
