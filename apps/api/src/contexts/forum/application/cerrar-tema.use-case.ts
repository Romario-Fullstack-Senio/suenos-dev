import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { TEMA_FORO_REPOSITORY, TemaForoRepository } from '../domain/tema-foro.repository.port';

@Injectable()
export class CerrarTemaUseCase {
  constructor(
    @Inject(TEMA_FORO_REPOSITORY)
    private readonly temaRepo: TemaForoRepository,
  ) {}

  async execute(temaId: string, cerrado: boolean): Promise<void> {
    const tema = await this.temaRepo.findById(temaId);
    if (!tema) throw new NotFoundDomainError('Tema no encontrado');
    tema.cerrar(cerrado);
    await this.temaRepo.save(tema);
  }
}
