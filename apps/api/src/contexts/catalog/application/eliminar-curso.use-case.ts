import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { CursoRepository, CURSO_REPOSITORY } from '../domain/curso.repository.port';

interface EliminarCursoCommand {
  cursoId: string;
  callerId: string;
  callerRol: string;
}

@Injectable()
export class EliminarCursoUseCase {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
  ) {}

  async execute(command: EliminarCursoCommand): Promise<void> {
    const curso = await this.cursoRepo.findById(command.cursoId);
    if (!curso) {
      throw new NotFoundDomainError('Curso no encontrado');
    }
    if (command.callerRol !== 'admin' && curso.instructorId !== command.callerId) {
      throw new UnauthorizedDomainError('No tienes permiso para eliminar este curso');
    }
    // Nota: no valida si hay estudiantes inscritos — borrar un curso con
    // inscripciones activas las deja huérfanas (sin FK dura entre contexts,
    // no falla, pero sus datos de "mis cursos" apuntarán a un curso inexistente).
    // Simplificación deliberada de este alcance; si hace falta bloquear el
    // borrado en ese caso, hay que inyectar INSCRIPCION_REPOSITORY acá.
    await this.cursoRepo.delete(command.cursoId);
  }
}
