import { Inject, Injectable } from '@nestjs/common';
import { CursoRepository, CURSO_REPOSITORY } from '../domain/curso.repository.port';
import { Leccion } from '../domain/leccion.entity';
import { v4 as uuid } from 'uuid';

interface AgregarLeccionCommand {
  cursoId: string;
  moduloId: string;
  titulo: string;
  orden: number;
  duracionSegundos: number;
}

@Injectable()
export class AgregarLeccionUseCase {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
  ) {}

  async execute(command: AgregarLeccionCommand): Promise<{ leccionId: string }> {
    const curso = await this.cursoRepo.findById(command.cursoId);
    if (!curso) {
      throw new Error('Curso no encontrado');
    }

    const leccion = Leccion.create(uuid(), command.titulo, command.orden, command.duracionSegundos);
    curso.agregarLeccion(command.moduloId, leccion);
    await this.cursoRepo.save(curso);

    return { leccionId: leccion.id };
  }
}
