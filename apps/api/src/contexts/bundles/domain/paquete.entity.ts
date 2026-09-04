import { AggregateRoot, DomainError } from '@suenos-dev/shared-kernel';

interface PaqueteProps {
  titulo: string;
  descripcion: string;
  cursoIds: string[];
  descuentoPorcentaje: number;
  activo: boolean;
  createdAt: Date;
}

function validar(titulo: string, cursoIds: string[], descuentoPorcentaje: number): void {
  if (!titulo || titulo.trim().length < 3) {
    throw new DomainError('El título debe tener al menos 3 caracteres');
  }
  const idsUnicos = new Set(cursoIds);
  if (idsUnicos.size < 2) {
    throw new DomainError('Un paquete necesita al menos 2 cursos distintos');
  }
  if (descuentoPorcentaje < 1 || descuentoPorcentaje > 90) {
    throw new DomainError('El descuento debe estar entre 1% y 90%');
  }
}

export class Paquete extends AggregateRoot<string> {
  private props: PaqueteProps;

  private constructor(id: string, props: PaqueteProps) {
    super(id);
    this.props = props;
  }

  static crear(
    id: string,
    params: { titulo: string; descripcion: string; cursoIds: string[]; descuentoPorcentaje: number },
  ): Paquete {
    validar(params.titulo, params.cursoIds, params.descuentoPorcentaje);
    return new Paquete(id, {
      titulo: params.titulo.trim(),
      descripcion: params.descripcion?.trim() ?? '',
      cursoIds: [...new Set(params.cursoIds)],
      descuentoPorcentaje: params.descuentoPorcentaje,
      activo: true,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: PaqueteProps): Paquete {
    return new Paquete(id, { ...props, cursoIds: [...props.cursoIds] });
  }

  get titulo(): string { return this.props.titulo; }
  get descripcion(): string { return this.props.descripcion; }
  get cursoIds(): string[] { return this.props.cursoIds; }
  get descuentoPorcentaje(): number { return this.props.descuentoPorcentaje; }
  get activo(): boolean { return this.props.activo; }
  get createdAt(): Date { return this.props.createdAt; }

  actualizar(params: { titulo: string; descripcion: string; cursoIds: string[]; descuentoPorcentaje: number }): void {
    validar(params.titulo, params.cursoIds, params.descuentoPorcentaje);
    this.props.titulo = params.titulo.trim();
    this.props.descripcion = params.descripcion?.trim() ?? '';
    this.props.cursoIds = [...new Set(params.cursoIds)];
    this.props.descuentoPorcentaje = params.descuentoPorcentaje;
    this.touch();
  }

  cambiarEstado(activo: boolean): void {
    this.props.activo = activo;
    this.touch();
  }

  /** Un carrito solo puede canjear el descuento del paquete si trae
   * exactamente los cursos que lo componen — ni de más ni de menos, así
   * nadie arma un carrito parcial y pretende el precio de paquete. */
  coincideCon(cursoIds: string[]): boolean {
    if (cursoIds.length !== this.props.cursoIds.length) return false;
    const propios = new Set(this.props.cursoIds);
    return cursoIds.every((id) => propios.has(id));
  }
}
