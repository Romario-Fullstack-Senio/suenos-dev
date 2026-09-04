import { NotificarCursoNuevoHandler } from './notificar-curso-nuevo.handler';
import { NotificacionService } from './notificacion.service';
import { Queue } from 'bull';
import { Email } from '../../identity/domain/email.value-object';

describe('NotificarCursoNuevoHandler', () => {
  let handler: NotificarCursoNuevoHandler;
  let mockUsuarioRepo: { findAll: jest.Mock };
  let mockQueue: { addBulk: jest.Mock };
  let mockNotificacionService: { guardar: jest.Mock };

  beforeEach(() => {
    mockUsuarioRepo = { findAll: jest.fn() };
    mockQueue = { addBulk: jest.fn().mockResolvedValue([]) };
    mockNotificacionService = { guardar: jest.fn().mockResolvedValue(undefined) };

    handler = new NotificarCursoNuevoHandler(
      mockUsuarioRepo as any,
      mockQueue as unknown as Queue,
      mockNotificacionService as unknown as NotificacionService,
    );
  });

  it('debería guardar notificación en DB y agregar un job por cada usuario', async () => {
    const usuarios = [
      { id: 'user-1', email: Email.create('user1@test.com'), nombre: 'Usuario 1', notificarCursoNuevo: true },
      { id: 'user-2', email: Email.create('user2@test.com'), nombre: 'Usuario 2', notificarCursoNuevo: true },
      { id: 'user-3', email: Email.create('user3@test.com'), nombre: 'Usuario 3', notificarCursoNuevo: true },
    ];
    mockUsuarioRepo.findAll.mockResolvedValue(usuarios);

    await handler.handle({
      aggregateId: 'curso-123',
      titulo: 'NestJS desde cero',
      slug: 'nestjs-desde-cero',
      descripcion: 'Aprende NestJS',
    });

    expect(mockUsuarioRepo.findAll).toHaveBeenCalledTimes(1);
    expect(mockNotificacionService.guardar).toHaveBeenCalledTimes(3);
    expect(mockQueue.addBulk).toHaveBeenCalledTimes(1);

    const jobs = mockQueue.addBulk.mock.calls[0][0];
    expect(jobs).toHaveLength(3);
    expect(jobs[0].data.destinatarioEmail).toBe('user1@test.com');
    expect(jobs[0].data.cursoTitulo).toBe('NestJS desde cero');
    expect(jobs[0].data.cursoSlug).toBe('nestjs-desde-cero');
    expect(jobs[0].opts.attempts).toBe(3);
    expect(jobs[0].opts.backoff.type).toBe('exponential');
  });

  it('debería manejar lista vacía de usuarios sin error', async () => {
    mockUsuarioRepo.findAll.mockResolvedValue([]);

    await handler.handle({
      aggregateId: 'curso-123',
      titulo: 'Curso Test',
      slug: 'curso-test',
      descripcion: 'Desc',
    });

    expect(mockNotificacionService.guardar).not.toHaveBeenCalled();
    expect(mockQueue.addBulk).not.toHaveBeenCalled();
  });

  it('debería procesar en lotes de 50 cuando hay muchos usuarios', async () => {
    const usuarios = Array.from({ length: 120 }, (_, i) => ({
      id: `user-${i}`,
      email: Email.create(`user${i}@test.com`),
      nombre: `Usuario ${i}`,
      notificarCursoNuevo: true,
    }));
    mockUsuarioRepo.findAll.mockResolvedValue(usuarios);

    await handler.handle({
      aggregateId: 'curso-456',
      titulo: 'Curso Masivo',
      slug: 'curso-masivo',
      descripcion: 'Desc',
    });

    // 120 usuarios → 120 notificaciones guardadas
    expect(mockNotificacionService.guardar).toHaveBeenCalledTimes(120);
    // 120 usuarios / 50 por lote = 3 lotes (50 + 50 + 20)
    expect(mockQueue.addBulk).toHaveBeenCalledTimes(3);
    expect(mockQueue.addBulk.mock.calls[0][0]).toHaveLength(50);
    expect(mockQueue.addBulk.mock.calls[1][0]).toHaveLength(50);
    expect(mockQueue.addBulk.mock.calls[2][0]).toHaveLength(20);
  });

  it('debería incluir todos los datos del curso en cada job', async () => {
    mockUsuarioRepo.findAll.mockResolvedValue([
      { id: 'user-test', email: Email.create('test@test.com'), nombre: 'Test User', notificarCursoNuevo: true },
    ]);

    await handler.handle({
      aggregateId: 'curso-789',
      titulo: 'TypeScript Avanzado',
      slug: 'typescript-avanzado',
      descripcion: 'Domina TypeScript',
    });

    const job = mockQueue.addBulk.mock.calls[0][0][0];
    expect(job.data).toEqual({
      cursoId: 'curso-789',
      cursoTitulo: 'TypeScript Avanzado',
      cursoSlug: 'typescript-avanzado',
      cursoDescripcion: 'Domina TypeScript',
      destinatarioEmail: 'test@test.com',
      destinatarioNombre: 'Test User',
    });
  });

  it('no notifica a usuarios que desactivaron los avisos de cursos nuevos', async () => {
    mockUsuarioRepo.findAll.mockResolvedValue([
      { id: 'user-1', email: Email.create('user1@test.com'), nombre: 'Usuario 1', notificarCursoNuevo: true },
      { id: 'user-2', email: Email.create('user2@test.com'), nombre: 'Usuario 2', notificarCursoNuevo: false },
    ]);

    await handler.handle({
      aggregateId: 'curso-123',
      titulo: 'Curso',
      slug: 'curso',
      descripcion: 'Desc',
    });

    expect(mockNotificacionService.guardar).toHaveBeenCalledTimes(1);
    expect(mockNotificacionService.guardar.mock.calls[0][0].usuarioId).toBe('user-1');
  });

  it('debería guardar notificación con tipo correcto', async () => {
    mockUsuarioRepo.findAll.mockResolvedValue([
      { id: 'u1', email: Email.create('a@b.com'), nombre: 'A', notificarCursoNuevo: true },
    ]);

    await handler.handle({
      aggregateId: 'c1',
      titulo: 'Curso',
      slug: 'curso',
      descripcion: 'Desc',
    });

    const notifGuardada = mockNotificacionService.guardar.mock.calls[0][0];
    expect(notifGuardada.tipo).toBe('curso_publicado');
    expect(notifGuardada.usuarioId).toBe('u1');
    expect(notifGuardada.titulo).toBe('Nuevo curso disponible');
    expect(notifGuardada.cursoId).toBe('c1');
    expect(notifGuardada.leida).toBe(false);
  });
});
