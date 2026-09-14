import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { randomUUID } from 'crypto';
import { Orden } from '../domain/orden.entity';
import { ORDEN_REPOSITORY, OrdenRepository } from '../domain/orden.repository.port';
import { STRIPE_PAYMENT_INTENT, StripePaymentIntent } from '../domain/stripe-payment-intent.port';
import { CUPON_REPOSITORY, CuponRepository } from '../domain/cupon.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';
import { PAQUETE_REPOSITORY, PaqueteRepository } from '../../bundles/domain/paquete.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { EventBus } from '../../../common/event-bus';

export interface CrearOrdenItemInput {
  cursoId: string;
  // El cliente puede seguir mandando cursoNombre/precio (así funcionaba el
  // carrito antes), pero se ignoran: el precio y el nombre reales se
  // resuelven acá contra CURSO_REPOSITORY. Si no, cualquiera con devtools
  // podría mandar { cursoId: "x", precio: 0.01 } y comprar gratis.
  cursoNombre?: string;
  precio?: number;
}

export interface CrearOrdenCommand {
  estudianteId: string;
  items: CrearOrdenItemInput[];
  successUrl: string;
  cancelUrl: string;
  // El cupón solo aplica cuando el carrito tiene un único curso — combinar
  // un cupón (casi siempre pensado para un curso puntual, ver
  // Cupon.cursoId) con una compra de varios cursos abre demasiadas
  // preguntas de producto (¿a cuál se le aplica? ¿se reparte?) para
  // resolver de forma genérica acá. El botón "Comprar ahora" de un curso
  // individual sigue soportando cupón exactamente igual que antes.
  cuponCodigo?: string;
  // Si viene, `items` tiene que traer EXACTAMENTE los cursos del paquete
  // (ver Paquete.coincideCon) — ahí se aplica el descuento del paquete a
  // cada ítem en vez de resolver el precio de lista de cada curso.
  paqueteId?: string;
}

@Injectable()
export class CrearOrdenUseCase {
  constructor(
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    @Inject(STRIPE_PAYMENT_INTENT)
    private readonly stripePaymentIntent: StripePaymentIntent,
    @Inject(CUPON_REPOSITORY)
    private readonly cuponRepository: CuponRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    @Inject(PAQUETE_REPOSITORY)
    private readonly paqueteRepository: PaqueteRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CrearOrdenCommand,
  ): Promise<{ ordenId: string; clientSecret: string | null; precioFinal: number; descuento: number; gratis: boolean }> {
    if (!command.items || command.items.length === 0) {
      throw new DomainError('La orden necesita al menos un curso');
    }

    const items = await Promise.all(
      command.items.map(async (i) => {
        const curso = await this.cursoRepository.findById(i.cursoId);
        if (!curso) {
          throw new NotFoundDomainError(`Curso ${i.cursoId} no encontrado`);
        }
        const precio = curso.precio.value;
        return { cursoId: curso.id, cursoNombre: curso.titulo, precio, id: randomUUID(), precioFinal: precio };
      }),
    );
    let descuento = 0;

    if (command.cuponCodigo && command.paqueteId) {
      throw new DomainError('No se puede combinar un cupón con la compra de un paquete');
    }

    if (command.cuponCodigo) {
      if (items.length > 1) {
        throw new DomainError('Los cupones solo se pueden aplicar comprando un curso a la vez');
      }
      const cupon = await this.cuponRepository.findByCodigo(command.cuponCodigo);
      if (!cupon) {
        throw new NotFoundDomainError('Cupón no encontrado');
      }
      const item = items[0];
      const resultado = cupon.esValidoPara(item.cursoId);
      if (!resultado.valido) {
        throw new DomainError(resultado.motivo ?? 'Cupón no válido');
      }
      // precioFinal igual se redondea acá (no solo confiar en que
      // calcularDescuento ya venga redondeado) — restar dos números con
      // 2 decimales puede seguir dejando resto flotante (49.99 - 4.99).
      descuento = cupon.calcularDescuento(item.precio);
      item.precioFinal = Math.max(Math.round((item.precio - descuento) * 100) / 100, 0);

      cupon.registrarUso();
      await this.cuponRepository.save(cupon);
    }

    if (command.paqueteId) {
      const paquete = await this.paqueteRepository.findById(command.paqueteId);
      if (!paquete || !paquete.activo) {
        throw new NotFoundDomainError('Paquete no encontrado');
      }
      if (!paquete.coincideCon(items.map((i) => i.cursoId))) {
        throw new DomainError('El carrito no coincide con los cursos del paquete');
      }
      const factor = 1 - paquete.descuentoPorcentaje / 100;
      for (const item of items) {
        const precioConDescuento = Math.round(item.precio * factor * 100) / 100;
        descuento += item.precio - precioConDescuento;
        item.precioFinal = precioConDescuento;
      }
      descuento = Math.round(descuento * 100) / 100;
    }

    // Redondeo final: sumar varios precios ya redondeados a 2 decimales
    // puede arrastrar error de punto flotante (ej. 22.49 + 37.49 =
    // 59.980000000000004) — sin este último round el clientSecret de
    // Stripe y la respuesta al frontend mostrarían ese ruido.
    const precioFinal = Math.round(items.reduce((sum, i) => sum + i.precioFinal, 0) * 100) / 100;

    // Un curso gratis (o un cupón/paquete que lo deja en $0) nunca llega a
    // Stripe: su API rechaza un PaymentIntent de monto 0 (mínimo 50 centavos
    // en USD), así que ni siquiera tendría sentido intentarlo. En vez de
    // eso, la orden se completa acá mismo — mismo camino que
    // OrdenController#confirmar tras un pago real — y el frontend nunca
    // llega a mostrar el formulario de Stripe.
    if (precioFinal === 0) {
      const ordenId = randomUUID();
      const orden = Orden.crear(
        ordenId,
        command.estudianteId,
        items.map((i) => ({ id: i.id, cursoId: i.cursoId, cursoNombre: i.cursoNombre, precio: i.precioFinal })),
        'usd',
        `gratis_${ordenId}`,
      );

      let alumnoEmail = '';
      let alumnoNombre = '';
      const usuario = await this.usuarioRepository.findById(command.estudianteId);
      if (usuario) {
        alumnoEmail = usuario.email.value || String(usuario.email);
        alumnoNombre = usuario.nombre;
      }

      orden.completar({ email: alumnoEmail, nombre: alumnoNombre });
      await this.ordenRepository.save(orden);

      for (const event of orden.pullDomainEvents()) {
        await this.eventBus.publish(event);
      }

      return { ordenId, clientSecret: null, precioFinal, descuento, gratis: true };
    }

    const { clientSecret, paymentIntentId } = await this.stripePaymentIntent.createPaymentIntent({
      amount: precioFinal,
      currency: 'usd',
      // Metadata de Stripe: solo texto plano, sirve para identificar el pago
      // en el dashboard de Stripe — el detalle real de ítems vive en la
      // orden, no acá.
      cursoId: items.length === 1 ? items[0].cursoId : `${items.length} cursos`,
      cursoNombre: items.map((i) => i.cursoNombre).join(', '),
    });

    const ordenId = randomUUID();
    const orden = Orden.crear(
      ordenId,
      command.estudianteId,
      items.map((i) => ({ id: i.id, cursoId: i.cursoId, cursoNombre: i.cursoNombre, precio: i.precioFinal })),
      'usd',
      paymentIntentId,
    );
    await this.ordenRepository.save(orden);

    return { ordenId, clientSecret, precioFinal, descuento, gratis: false };
  }
}
