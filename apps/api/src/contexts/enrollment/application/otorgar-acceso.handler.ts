import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { Inscripcion } from '../domain/inscripcion.entity';
import {
  InscripcionRepository,
  INSCRIPCION_REPOSITORY,
} from '../domain/inscripcion.repository.port';

export class CursoCompradoEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly estudianteId: string,
    public readonly cursoId: string,
  ) {}
}

@Injectable()
export class OtorgarAccesoHandler {
  constructor(
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepository: InscripcionRepository,
  ) {}

  @OnEvent('CursoComprado')
  async handle(event: CursoCompradoEvent): Promise<void> {
    const existente = await this.inscripcionRepository.findByCursoYEstudiante(
      event.cursoId,
      event.estudianteId,
    );

    if (existente) {
      if (!existente.activa) {
        existente.activar();
      }
      return;
    }

    const inscripcion = Inscripcion.crear(
      randomUUID(),
      event.estudianteId,
      event.cursoId,
    );

    await this.inscripcionRepository.save(inscripcion);
  }
}
