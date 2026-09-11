import { TemaForo } from './tema-foro.entity';
import { RespuestaForo } from './respuesta-foro.entity';

function crearTema() {
  return TemaForo.crear('t1', {
    autorId: 'autor-1',
    autorNombre: 'Ana',
    titulo: '¿Alguien más usa NestJS con TypeORM?',
    texto: 'Quería compartir mi experiencia armando el proyecto final...',
    categoria: 'general',
  });
}

describe('TemaForo', () => {
  it('crea un tema válido sin respuestas, no fijado ni cerrado', () => {
    const tema = crearTema();
    expect(tema.titulo).toContain('NestJS');
    expect(tema.fijado).toBe(false);
    expect(tema.cerrado).toBe(false);
    expect(tema.respuestas).toHaveLength(0);
  });

  it('rechaza categoría inválida', () => {
    expect(() =>
      TemaForo.crear('t1', { autorId: 'a1', autorNombre: 'Ana', titulo: 'Título', texto: 'Texto', categoria: 'no-existe' }),
    ).toThrow('Categoría de tema inválida');
  });

  it('rechaza título o texto vacíos', () => {
    expect(() =>
      TemaForo.crear('t1', { autorId: 'a1', autorNombre: 'Ana', titulo: '   ', texto: 'Texto', categoria: 'general' }),
    ).toThrow('título');
    expect(() =>
      TemaForo.crear('t1', { autorId: 'a1', autorNombre: 'Ana', titulo: 'Título', texto: '  ', categoria: 'general' }),
    ).toThrow('mensaje');
  });

  it('agregarRespuesta() agrega una respuesta', () => {
    const tema = crearTema();
    const respuesta = RespuestaForo.crear('r1', { autorId: 'a2', autorNombre: 'Beto', autorEsAdmin: false, texto: 'A mí también me pasó' });
    tema.agregarRespuesta(respuesta);
    expect(tema.respuestas).toHaveLength(1);
  });

  it('un tema cerrado rechaza respuestas de alumnos', () => {
    const tema = crearTema();
    tema.cerrar(true);
    const respuesta = RespuestaForo.crear('r1', { autorId: 'a2', autorNombre: 'Beto', autorEsAdmin: false, texto: 'Puedo responder?' });
    expect(() => tema.agregarRespuesta(respuesta)).toThrow('cerrado');
  });

  it('un admin puede seguir respondiendo aunque el tema esté cerrado', () => {
    const tema = crearTema();
    tema.cerrar(true);
    const respuesta = RespuestaForo.crear('r1', { autorId: 'admin-1', autorNombre: 'Admin', autorEsAdmin: true, texto: 'Cerrando el hilo, gracias a todos' });
    expect(() => tema.agregarRespuesta(respuesta)).not.toThrow();
  });

  it('verificarPuedeEliminar() permite al autor o a un admin, rechaza a terceros', () => {
    const tema = crearTema();
    expect(() => tema.verificarPuedeEliminar('autor-1', false)).not.toThrow();
    expect(() => tema.verificarPuedeEliminar('otro-usuario', true)).not.toThrow();
    expect(() => tema.verificarPuedeEliminar('otro-usuario', false)).toThrow('No tenés permiso');
  });

  describe('moderación por reportes', () => {
    it('se oculta sola al llegar al umbral de reportes', () => {
      const tema = crearTema();
      tema.reportar('u1');
      tema.reportar('u2');
      expect(tema.oculta).toBe(false);
      tema.reportar('u3');
      expect(tema.totalReportes).toBe(3);
      expect(tema.oculta).toBe(true);
    });

    it('un mismo usuario no puede reportar dos veces', () => {
      const tema = crearTema();
      tema.reportar('u1');
      expect(() => tema.reportar('u1')).toThrow('Ya reportaste este tema');
    });

    it('el autor no puede reportar su propio tema', () => {
      const tema = crearTema();
      expect(() => tema.reportar('autor-1')).toThrow('No podés reportar tu propio tema');
    });

    it('restaurar() lo vuelve a mostrar y limpia los reportes', () => {
      const tema = crearTema();
      tema.reportar('u1');
      tema.reportar('u2');
      tema.reportar('u3');
      tema.restaurar();
      expect(tema.oculta).toBe(false);
      expect(tema.totalReportes).toBe(0);
    });
  });
});
