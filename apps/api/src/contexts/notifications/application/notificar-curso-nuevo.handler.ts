import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuid } from 'uuid';
import { UsuarioRepository, USUARIO_REPOSITORY } from '../../identity/domain/usuario.repository.port';
import { EnviarEmailCursoNuevoJob } from '../infrastructure/queue/notificacion-curso-nuevo.processor';
import { NotificacionService } from './notificacion.service';
import { Notificacion } from '../domain/notificacion.entity';

const BATCH_SIZE = 50;
const QUEUE_NAME = 'curso-nuevo-emails';

interface CursoPublicadoEvent {
  aggregateId: string;
  titulo: string;
  slug: string;
  descripcion: string;
}

@Injectable()
export class NotificarCursoNuevoHandler {
  private readonly logger = new Logger(NotificarCursoNuevoHandler.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @InjectQueue(QUEUE_NAME)
    private readonly emailQueue: Queue<EnviarEmailCursoNuevoJob>,
    private readonly notificacionService: NotificacionService,
  ) {}

  @OnEvent('CursoPublicado')
  async handle(event: CursoPublicadoEvent): Promise<void> {
    this.logger.log(
      `[EVENT] CursoPublicado recibido: "${event.titulo}" (${event.aggregateId}). Encolando emails...`,
    );

    const usuarios = await this.usuarioRepo.findAll();

    if (!usuarios || usuarios.length === 0) {
      this.logger.warn('No hay usuarios registrados para notificar');
      return;
    }

    this.logger.log(`Enviando ${usuarios.length} notificaciones a la cola...`);

    // Guardar notificación en DB + encolar email por cada usuario
    const jobs: EnviarEmailCursoNuevoJob[] = [];

    for (const usuario of usuarios) {
      // 1. Guardar notificación en la tabla notificaciones
      const notificacion = Notificacion.crear({
        id: uuid(),
        usuarioId: usuario.id,
        titulo: 'Nuevo curso disponible',
        mensaje: `Se publicó el curso "${event.titulo}". ¡Inscríbete ahora!`,
        tipo: 'curso_publicado',
        cursoId: event.aggregateId,
      });

      await this.notificacionService.guardar(notificacion);

      // 2. Preparar job para envío de email
      jobs.push({
        cursoId: event.aggregateId,
        cursoTitulo: event.titulo,
        cursoSlug: event.slug,
        cursoDescripcion: event.descripcion,
        destinatarioEmail: usuario.email.value,
        destinatarioNombre: usuario.nombre,
      });
    }

    // Procesar en lotes de BATCH_SIZE para no saturar la cola de golpe
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const lote = jobs.slice(i, i + BATCH_SIZE);
      await this.emailQueue.addBulk(
        lote.map((jobData) => ({
          data: jobData,
          opts: {
            attempts: 3,
            backoff: {
              type: 'exponential' as const,
              delay: 2000,
            },
          },
        })),
      );
      this.logger.log(
        `Lote ${Math.floor(i / BATCH_SIZE) + 1} encolado: ${lote.length} emails`,
      );
    }

    this.logger.log(
      `Total: ${jobs.length} notificaciones guardadas + emails encolados para "${event.titulo}"`,
    );
  }
}
