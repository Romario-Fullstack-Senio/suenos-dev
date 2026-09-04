import { Entity, DomainError } from '@suenos-dev/shared-kernel';

interface RespuestaProps {
  autorId: string;
  autorNombre: string;
  autorEsInstructor: boolean;
  texto: string;
  createdAt: Date;
}

export class Respuesta extends Entity<string> {
  private props: RespuestaProps;

  private constructor(id: string, props: RespuestaProps) {
    super(id);
    this.props = props;
  }

  static crear(id: string, params: { autorId: string; autorNombre: string; autorEsInstructor: boolean; texto: string }): Respuesta {
    const texto = params.texto?.trim();
    if (!texto) throw new DomainError('La respuesta no puede estar vacía');
    if (texto.length > 3000) throw new DomainError('La respuesta es demasiado larga (máx. 3000 caracteres)');
    return new Respuesta(id, {
      autorId: params.autorId,
      autorNombre: params.autorNombre,
      autorEsInstructor: params.autorEsInstructor,
      texto,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: RespuestaProps): Respuesta {
    return new Respuesta(id, { ...props });
  }

  get autorId(): string { return this.props.autorId; }
  get autorNombre(): string { return this.props.autorNombre; }
  get autorEsInstructor(): boolean { return this.props.autorEsInstructor; }
  get texto(): string { return this.props.texto; }
  get createdAt(): Date { return this.props.createdAt; }
}
