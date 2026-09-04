import { Entity } from '@suenos-dev/shared-kernel';

interface FavoritoProps {
  usuarioId: string;
  cursoId: string;
  createdAt: Date;
}

export class Favorito extends Entity<string> {
  private props: FavoritoProps;

  private constructor(id: string, props: FavoritoProps) {
    super(id);
    this.props = props;
  }

  static crear(id: string, usuarioId: string, cursoId: string): Favorito {
    return new Favorito(id, { usuarioId, cursoId, createdAt: new Date() });
  }

  static reconstitute(id: string, props: FavoritoProps): Favorito {
    return new Favorito(id, { ...props });
  }

  get usuarioId(): string { return this.props.usuarioId; }
  get cursoId(): string { return this.props.cursoId; }
  get createdAt(): Date { return this.props.createdAt; }
}
