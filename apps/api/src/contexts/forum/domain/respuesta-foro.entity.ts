import { Entity, DomainError } from '@suenos-dev/shared-kernel';

interface RespuestaForoProps {
  autorId: string;
  autorNombre: string;
  autorEsAdmin: boolean;
  texto: string;
  createdAt: Date;
}

export class RespuestaForo extends Entity<string> {
  private props: RespuestaForoProps;

  private constructor(id: string, props: RespuestaForoProps) {
    super(id);
    this.props = props;
  }

  static crear(id: string, params: { autorId: string; autorNombre: string; autorEsAdmin: boolean; texto: string }): RespuestaForo {
    const texto = params.texto?.trim();
    if (!texto) throw new DomainError('La respuesta no puede estar vacía');
    if (texto.length > 5000) throw new DomainError('La respuesta es demasiado larga (máx. 5000 caracteres)');
    return new RespuestaForo(id, {
      autorId: params.autorId,
      autorNombre: params.autorNombre,
      autorEsAdmin: params.autorEsAdmin,
      texto,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: RespuestaForoProps): RespuestaForo {
    return new RespuestaForo(id, { ...props });
  }

  get autorId(): string { return this.props.autorId; }
  get autorNombre(): string { return this.props.autorNombre; }
  get autorEsAdmin(): boolean { return this.props.autorEsAdmin; }
  get texto(): string { return this.props.texto; }
  get createdAt(): Date { return this.props.createdAt; }
}
