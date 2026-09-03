import { Inject, Injectable } from '@nestjs/common';
import { Curso, NivelCurso } from '../domain/curso.entity';
import { CursoRepository, CURSO_REPOSITORY } from '../domain/curso.repository.port';
import { v4 as uuid } from 'uuid';

interface CrearCursoCommand {
  titulo: string;
  descripcion: string;
  precio: number;
  instructorId: string;
  imagenUrl?: string;
  categoria?: string;
  nivel?: NivelCurso;
  objetivos?: string[];
  requisitos?: string[];
  audiencia?: string;
}

@Injectable()
export class CrearCursoUseCase {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
  ) {}

  async execute(command: CrearCursoCommand): Promise<{ id: string; slug: string }> {
    const id = uuid();
    const curso = Curso.create(id, command);
    await this.cursoRepo.save(curso);
    return { id, slug: curso.slug.value };
  }
}
