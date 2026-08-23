import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '../../../common/event-bus';
import {
  ProgresoLeccionRepository,
  PROGRESO_LECCION_REPOSITORY,
} from '../domain/progreso-leccion.repository.port';
import { ProgresoLeccion } from '../domain/progreso-leccion.entity';
import { v4 as uuid } from 'uuid';

interface RegistrarProgresoCommand {
  estudianteId: string;
  leccionId: string;
  cursoId: string;
  segundosVistos: number;
  duracionTotal: number;
}

@Injectable()
export class RegistrarProgresoUseCase {
  constructor(
    @Inject(PROGRESO_LECCION_REPOSITORY)
    private readonly repository: ProgresoLeccionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegistrarProgresoCommand): Promise<void> {
    let progreso = await this.repository.findByLeccionYEstudiante(
      command.leccionId,
      command.estudianteId,
    );

    if (!progreso) {
      progreso = ProgresoLeccion.create(
        uuid(),
        command.estudianteId,
        command.leccionId,
        command.cursoId,
      );
    }

    progreso.registrarProgreso(command.segundosVistos, command.duracionTotal);
    await this.repository.save(progreso);

    for (const event of progreso.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
