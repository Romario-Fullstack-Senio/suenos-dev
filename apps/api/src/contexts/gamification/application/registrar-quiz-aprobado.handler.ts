import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import {
  PERFIL_GAMIFICACION_REPOSITORY,
  PerfilGamificacionRepository,
} from '../domain/perfil-gamificacion.repository.port';
import { PerfilGamificacion } from '../domain/perfil-gamificacion.entity';

interface QuizAprobadoPayload {
  estudianteId: string;
}

@Injectable()
export class RegistrarQuizAprobadoHandler {
  private readonly logger = new Logger(RegistrarQuizAprobadoHandler.name);

  constructor(
    @Inject(PERFIL_GAMIFICACION_REPOSITORY)
    private readonly perfilRepo: PerfilGamificacionRepository,
  ) {}

  @OnEvent('QuizAprobado')
  async handle(event: QuizAprobadoPayload): Promise<void> {
    let perfil = await this.perfilRepo.findByUsuarioId(event.estudianteId);
    if (!perfil) {
      perfil = PerfilGamificacion.crear(uuid(), event.estudianteId);
    }
    const insigniasNuevas = perfil.registrarQuizAprobado();
    await this.perfilRepo.save(perfil);
    if (insigniasNuevas.length > 0) {
      this.logger.log(`Usuario ${event.estudianteId} ganó insignias: ${insigniasNuevas.join(', ')}`);
    }
  }
}
