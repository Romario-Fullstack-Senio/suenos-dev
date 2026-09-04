import { AggregateRoot, DomainError } from '@suenos-dev/shared-kernel';
import { OrdenItem } from './orden-item.entity';
import { CursoCompradoEvent } from './events/curso-comprado.event';
import { OrdenReembolsadaEvent } from './events/orden-reembolsada.event';

export type OrdenEstado = 'pendiente' | 'completada' | 'fallida' | 'reembolsada';

export interface OrdenProps {
  estudianteId: string;
  items: OrdenItem[];
  moneda: string;
  stripeSessionId: string;
  estado: OrdenEstado;
}

export class Orden extends AggregateRoot<string> {
  private props: OrdenProps;

  private constructor(id: string, props: OrdenProps) {
    super(id);
    if (props.items.length === 0) {
      throw new DomainError('Una orden necesita al menos un ítem');
    }
    this.props = props;
  }

  get estudianteId(): string {
    return this.props.estudianteId;
  }

  get items(): OrdenItem[] {
    return this.props.items;
  }

  /** Total de la orden — suma de todos los ítems. Antes era un campo propio
   * (`monto`); ahora se deriva de los ítems para no poder desincronizarse. */
  get monto(): number {
    return this.props.items.reduce((sum, item) => sum + item.precio, 0);
  }

  get moneda(): string {
    return this.props.moneda;
  }

  get stripeSessionId(): string {
    return this.props.stripeSessionId;
  }

  get estado(): OrdenEstado {
    return this.props.estado;
  }

  completar(alumno?: { email?: string; nombre?: string }): void {
    this.props.estado = 'completada';
    this.touch();
    // Un evento CursoComprado por ítem — es lo que ya usan
    // OtorgarAccesoHandler (inscripción) y el email de confirmación de
    // compra, sin cambios, tanto si la orden tiene 1 curso como 5.
    for (const item of this.props.items) {
      this.addDomainEvent(
        new CursoCompradoEvent(
          this.id,
          this.props.estudianteId,
          item.cursoId,
          alumno?.email || '',
          alumno?.nombre || '',
          item.cursoNombre,
          item.precio,
        ),
      );
    }
  }

  reembolsar(): void {
    if (this.props.estado !== 'completada') {
      throw new DomainError('Solo se puede reembolsar una orden completada');
    }
    this.props.estado = 'reembolsada';
    this.touch();
    // Mismo criterio que completar(): un evento por ítem, así el email de
    // reembolso y la baja de inscripción tratan cada curso por separado.
    for (const item of this.props.items) {
      this.addDomainEvent(
        new OrdenReembolsadaEvent(this.id, this.props.estudianteId, item.cursoId, item.precio),
      );
    }
  }

  static crear(
    id: string,
    estudianteId: string,
    items: { id: string; cursoId: string; cursoNombre: string; precio: number }[],
    moneda: string,
    stripeSessionId: string,
  ): Orden {
    return new Orden(id, {
      estudianteId,
      items: items.map((i) => OrdenItem.crear(i.id, { cursoId: i.cursoId, cursoNombre: i.cursoNombre, precio: i.precio })),
      moneda,
      stripeSessionId,
      estado: 'pendiente',
    });
  }

  static restore(
    id: string,
    estudianteId: string,
    items: { id: string; cursoId: string; cursoNombre: string; precio: number }[],
    moneda: string,
    stripeSessionId: string,
    estado: OrdenEstado,
    createdAt?: Date,
  ): Orden {
    const orden = new Orden(id, {
      estudianteId,
      items: items.map((i) => OrdenItem.reconstitute(i.id, { cursoId: i.cursoId, cursoNombre: i.cursoNombre, precio: i.precio })),
      moneda,
      stripeSessionId,
      estado,
    });
    // Entity's constructor siempre pisa _createdAt con `new Date()` — sin
    // esto, una orden reconstituida desde la DB "olvida" cuándo se compró
    // de verdad (encontrado al implementar la ventana de reembolso, que
    // necesita la fecha real de compra).
    if (createdAt) {
      Object.defineProperty(orden, '_createdAt', { value: createdAt });
    }
    return orden;
  }
}
