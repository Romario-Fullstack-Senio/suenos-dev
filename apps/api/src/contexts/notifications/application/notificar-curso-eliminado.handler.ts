import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificacionRepository, NOTIFICACION_REPOSITORY } from '../domain/notificacion.repository.port';

interface CursoEliminadoEvent {
  aggregateId: string;
}

/** Borra las notificaciones ("curso nuevo", "pregunta nueva") que apuntaban
 * a un curso que ya no existe. Sin esto quedan huérfanas — al tocarlas,
 * NotificationBell manda a /cursos/<uuid muerto>, que ahora sí redirige
 * correctamente si el curso existe, pero da 404 si de verdad fue borrado
 * (ver fix en apps/web/src/app/cursos/[slug]/page.tsx). Mejor que ni
 * aparezcan. */
@Injectable()
export class NotificarCursoEliminadoHandler {
  private readonly logger = new Logger(NotificarCursoEliminadoHandler.name);

  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly notificacionRepo: NotificacionRepository,
  ) {}

  @OnEvent('CursoEliminado')
  async handle(event: CursoEliminadoEvent): Promise<void> {
    await this.notificacionRepo.deleteByCursoId(event.aggregateId);
    this.logger.log(`[EVENT] CursoEliminado recibido (${event.aggregateId}). Notificaciones huérfanas limpiadas.`);
  }
}
