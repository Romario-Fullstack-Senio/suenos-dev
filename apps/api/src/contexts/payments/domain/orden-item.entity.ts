import { Entity, DomainError } from '@suenos-dev/shared-kernel';

interface OrdenItemProps {
  cursoId: string;
  cursoNombre: string;
  precio: number;
}

/** Una línea de la orden — un curso comprado a un precio dado (ya con
 * cualquier descuento de cupón aplicado). Denormaliza cursoNombre igual que
 * el resto del código (Resena.estudianteNombre, etc.) para no depender de
 * un JOIN/lookup al mostrar el historial de compras o la factura. */
export class OrdenItem extends Entity<string> {
  private props: OrdenItemProps;

  private constructor(id: string, props: OrdenItemProps) {
    super(id);
    this.props = props;
  }

  static crear(id: string, params: { cursoId: string; cursoNombre: string; precio: number }): OrdenItem {
    if (params.precio < 0) {
      throw new DomainError('El precio de un ítem de la orden no puede ser negativo');
    }
    return new OrdenItem(id, { ...params });
  }

  static reconstitute(id: string, props: OrdenItemProps): OrdenItem {
    return new OrdenItem(id, { ...props });
  }

  get cursoId(): string { return this.props.cursoId; }
  get cursoNombre(): string { return this.props.cursoNombre; }
  get precio(): number { return this.props.precio; }
}
