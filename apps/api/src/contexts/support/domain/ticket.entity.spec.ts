import { Ticket } from './ticket.entity';
import { MensajeTicket } from './mensaje-ticket.entity';

describe('Ticket', () => {
  it('se crea abierto con el mensaje inicial', () => {
    const ticket = Ticket.crear('t1', {
      usuarioId: 'u1',
      usuarioNombre: 'Ana',
      asunto: 'No puedo pagar',
      categoria: 'pagos',
      mensajeInicialId: 'm1',
      texto: 'El pago con tarjeta no funciona',
    });

    expect(ticket.estado).toBe('abierto');
    expect(ticket.mensajes).toHaveLength(1);
    expect(ticket.mensajes[0].texto).toBe('El pago con tarjeta no funciona');
    const eventos = ticket.pullDomainEvents();
    expect(eventos).toHaveLength(1);
    expect(eventos[0].eventName).toBe('TicketCreado');
  });

  it('rechaza una categoría inválida', () => {
    expect(() =>
      Ticket.crear('t1', {
        usuarioId: 'u1',
        usuarioNombre: 'Ana',
        asunto: 'Asunto',
        categoria: 'inexistente',
        mensajeInicialId: 'm1',
        texto: 'texto',
      }),
    ).toThrow('Categoría de ticket inválida');
  });

  it('pasa a "en_proceso" cuando responde un admin', () => {
    const ticket = Ticket.crear('t1', {
      usuarioId: 'u1',
      usuarioNombre: 'Ana',
      asunto: 'Asunto',
      categoria: 'otro',
      mensajeInicialId: 'm1',
      texto: 'texto',
    });
    ticket.pullDomainEvents();

    ticket.agregarMensaje(MensajeTicket.crear('m2', { autorId: 'admin1', autorNombre: 'Soporte', autorEsAdmin: true, texto: 'Ya lo vemos' }));

    expect(ticket.estado).toBe('en_proceso');
    expect(ticket.mensajes).toHaveLength(2);
    const eventos = ticket.pullDomainEvents();
    expect(eventos[0].eventName).toBe('MensajeTicketCreado');
  });

  it('se reabre si el dueño escribe en un ticket cerrado', () => {
    const ticket = Ticket.crear('t1', {
      usuarioId: 'u1',
      usuarioNombre: 'Ana',
      asunto: 'Asunto',
      categoria: 'otro',
      mensajeInicialId: 'm1',
      texto: 'texto',
    });
    ticket.cambiarEstado('cerrado');

    ticket.agregarMensaje(MensajeTicket.crear('m2', { autorId: 'u1', autorNombre: 'Ana', autorEsAdmin: false, texto: 'Sigue pasando' }));

    expect(ticket.estado).toBe('abierto');
  });

  it('un admin puede escribir en un ticket cerrado sin reabrirlo', () => {
    const ticket = Ticket.crear('t1', {
      usuarioId: 'u1',
      usuarioNombre: 'Ana',
      asunto: 'Asunto',
      categoria: 'otro',
      mensajeInicialId: 'm1',
      texto: 'texto',
    });
    ticket.cambiarEstado('cerrado');

    ticket.agregarMensaje(MensajeTicket.crear('m2', { autorId: 'admin1', autorNombre: 'Soporte', autorEsAdmin: true, texto: 'Nota interna' }));

    expect(ticket.estado).toBe('cerrado');
  });

  it('verificarAcceso rechaza a quien no es el dueño ni admin', () => {
    const ticket = Ticket.crear('t1', {
      usuarioId: 'u1',
      usuarioNombre: 'Ana',
      asunto: 'Asunto',
      categoria: 'otro',
      mensajeInicialId: 'm1',
      texto: 'texto',
    });

    expect(() => ticket.verificarAcceso('u2', false)).toThrow('No tenés acceso a este ticket');
    expect(() => ticket.verificarAcceso('u1', false)).not.toThrow();
    expect(() => ticket.verificarAcceso('cualquiera', true)).not.toThrow();
  });
});
