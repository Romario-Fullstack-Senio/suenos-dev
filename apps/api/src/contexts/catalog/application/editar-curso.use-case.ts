import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { CursoRepository, CURSO_REPOSITORY } from '../domain/curso.repository.port';
import { NivelCurso } from '../domain/curso.entity';

interface EditarCursoCommand {
  cursoId: string;
  callerId: string;
  callerRol: string;
  titulo?: string;
  descripcion?: string;
  precio?: number;
  imagenUrl?: string;
  categoria?: string;
  nivel?: NivelCurso;
  objetivos?: string[];
  requisitos?: string[];
  audiencia?: string;
}

@Injectable()
export class EditarCursoUseCase {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
  ) {}

  async execute(command: EditarCursoCommand): Promise<void> {
    const curso = await this.cursoRepo.findById(command.cursoId);
    if (!curso) {
      throw new NotFoundDomainError('Curso no encontrado');
    }
    if (command.callerRol !== 'admin' && curso.instructorId !== command.callerId) {
      throw new UnauthorizedDomainError('No tienes permiso para editar este curso');
    }

    curso.actualizar({
      titulo: command.titulo,
      descripcion: command.descripcion,
      precio: command.precio,
      imagenUrl: command.imagenUrl,
      categoria: command.categoria,
      nivel: command.nivel,
      objetivos: command.objetivos,
      requisitos: command.requisitos,
      audiencia: command.audiencia,
    });
    await this.cursoRepo.save(curso);
  }
}
