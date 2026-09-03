import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { CursoRepository, CURSO_REPOSITORY } from '../domain/curso.repository.port';
import { Modulo } from '../domain/modulo.entity';
import { v4 as uuid } from 'uuid';

interface AgregarModuloCommand {
  cursoId: string;
  titulo: string;
  orden: number;
}

@Injectable()
export class AgregarModuloUseCase {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepo: CursoRepository,
  ) {}

  async execute(command: AgregarModuloCommand): Promise<{ moduloId: string }> {
    const curso = await this.cursoRepo.findById(command.cursoId);
    if (!curso) {
      throw new NotFoundDomainError('Curso no encontrado');
    }

    const modulo = Modulo.create(uuid(), command.titulo, command.orden);
    curso.agregarModulo(modulo);
    await this.cursoRepo.save(curso);

    return { moduloId: modulo.id };
  }
}
