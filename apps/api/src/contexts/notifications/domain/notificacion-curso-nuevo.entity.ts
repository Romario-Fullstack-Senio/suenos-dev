import { Entity } from '@suenos-dev/shared-kernel';

interface NotificacionCursoNuevoProps {
  cursoId: string;
  titulo: string;
  slug: string;
  descripcion: string;
  destinatarioEmail: string;
  destinatarioNombre: string;
  enviado: boolean;
  error: string | null;
  createdAt: Date;
}

export class NotificacionCursoNuevo extends Entity<string> {
  private props: NotificacionCursoNuevoProps;

  private constructor(id: string, props: NotificacionCursoNuevoProps) {
    super(id);
    this.props = props;
  }

  static crear(params: {
    id: string;
    cursoId: string;
    titulo: string;
    slug: string;
    descripcion: string;
    destinatarioEmail: string;
    destinatarioNombre: string;
  }): NotificacionCursoNuevo {
    return new NotificacionCursoNuevo(params.id, {
      cursoId: params.cursoId,
      titulo: params.titulo,
      slug: params.slug,
      descripcion: params.descripcion,
      destinatarioEmail: params.destinatarioEmail,
      destinatarioNombre: params.destinatarioNombre,
      enviado: false,
      error: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: NotificacionCursoNuevoProps): NotificacionCursoNuevo {
    return new NotificacionCursoNuevo(id, { ...props });
  }

  get cursoId(): string { return this.props.cursoId; }
  get titulo(): string { return this.props.titulo; }
  get slug(): string { return this.props.slug; }
  get descripcion(): string { return this.props.descripcion; }
  get destinatarioEmail(): string { return this.props.destinatarioEmail; }
  get destinatarioNombre(): string { return this.props.destinatarioNombre; }
  get enviado(): boolean { return this.props.enviado; }
  get error(): string | null { return this.props.error; }
  get createdAt(): Date { return this.props.createdAt; }

  marcarEnviado(): void {
    this.props.enviado = true;
    this.props.error = null;
  }

  marcarError(mensaje: string): void {
    this.props.error = mensaje;
  }
}
