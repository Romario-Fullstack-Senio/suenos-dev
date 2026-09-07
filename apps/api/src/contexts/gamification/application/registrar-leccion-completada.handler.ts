import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import {
  PERFIL_GAMIFICACION_REPOSITORY,
  PerfilGamificacionRepository,
} from '../domain/perfil-gamificacion.repository.port';
import { PerfilGamificacion } from '../domain/perfil-gamificacion.entity';

interface LeccionCompletadaPayload {
  estudianteId: string;
}

/** LeccionCompletada (content-delivery) no tenía ningún listener antes de
 * esto — se emitía al aire. Acá es donde suma puntos, cuenta la lección
 * para las insignias de progreso, y actualiza la racha del estudiante. */
@Injectable()
export class RegistrarLeccionCompletadaHandler {
  private readonly logger = new Logger(RegistrarLeccionCompletadaHandler.name);

  constructor(
    @Inject(PERFIL_GAMIFICACION_REPOSITORY)
    private readonly perfilRepo: PerfilGamificacionRepository,
  ) {}

  @OnEvent('LeccionCompletada')
  async handle(event: LeccionCompletadaPayload): Promise<void> {
    let perfil = await this.perfilRepo.findByUsuarioId(event.estudianteId);
    if (!perfil) {
      perfil = PerfilGamificacion.crear(uuid(), event.estudianteId);
    }
    const insigniasNuevas = perfil.registrarLeccionCompletada();
    await this.perfilRepo.save(perfil);
    if (insigniasNuevas.length > 0) {
      this.logger.log(`Usuario ${event.estudianteId} ganó insignias: ${insigniasNuevas.join(', ')}`);
    }
  }
}
