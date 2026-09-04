import { Inject, Injectable } from '@nestjs/common';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';
import { INSCRIPCION_REPOSITORY, InscripcionRepository } from '../../enrollment/domain/inscripcion.repository.port';

export interface VerificarAccesoVideoCommand {
  leccionId: string;
  usuarioId?: string;
  usuarioRol?: string;
}

@Injectable()
export class VerificarAccesoVideoUseCase {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepo: InscripcionRepository,
  ) {}

  /** true si puede ver el video, false si no. `leccionId` inexistente
   * también devuelve false (el controller lo traduce a 404 en ese caso
   * particular, ver VideoController). */
  async execute(command: VerificarAccesoVideoCommand): Promise<{ permitido: boolean; existe: boolean }> {
    const info = await this.cursoRepo.findInfoByLeccionId(command.leccionId);
    if (!info) {
      return { permitido: false, existe: false };
    }

    // Vista previa gratuita: cualquiera, sin loguearse.
    if (info.esVistaPrevia) {
      return { permitido: true, existe: true };
    }

    if (!command.usuarioId) {
      return { permitido: false, existe: true };
    }

    // Admin, y el propio instructor dueño del curso (necesita poder
    // previsualizar su contenido sin tener que "comprarlo").
    if (command.usuarioRol === 'admin' || command.usuarioId === info.instructorId) {
      return { permitido: true, existe: true };
    }

    const inscripcion = await this.inscripcionRepo.findByCursoYEstudiante(info.cursoId, command.usuarioId);
    if (!inscripcion?.activa) {
      return { permitido: false, existe: true };
    }

    // Liberación programada: la lección recién se habilita a los N días
    // de la fecha de inscripción DE ESTE alumno — no de una fecha de
    // calendario fija, así que da igual cuándo se haya inscripto.
    if (info.diasDesdeInscripcion > 0) {
      const disponibleDesde = new Date(inscripcion.fechaInscripcion);
      disponibleDesde.setDate(disponibleDesde.getDate() + info.diasDesdeInscripcion);
      if (new Date() < disponibleDesde) {
        return { permitido: false, existe: true };
      }
    }

    return { permitido: true, existe: true };
  }
}
