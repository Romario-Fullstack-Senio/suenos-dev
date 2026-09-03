import { Inject, Injectable } from '@nestjs/common';
import { RESENA_REPOSITORY, ResenaRepository } from '../domain/resena.repository.port';

@Injectable()
export class ResumenResenasUseCase {
  constructor(
    @Inject(RESENA_REPOSITORY)
    private readonly resenaRepo: ResenaRepository,
  ) {}

  async execute(cursoIds: string[]) {
    return this.resenaRepo.resumenPorCursos(cursoIds);
  }
}
