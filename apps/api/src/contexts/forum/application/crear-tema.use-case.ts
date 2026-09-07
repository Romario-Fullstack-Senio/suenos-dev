import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { TemaForo } from '../domain/tema-foro.entity';
import { TEMA_FORO_REPOSITORY, TemaForoRepository } from '../domain/tema-foro.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

interface CrearTemaCommand {
  autorId: string;
  titulo: string;
  texto: string;
  categoria: string;
}

@Injectable()
export class CrearTemaUseCase {
  constructor(
    @Inject(TEMA_FORO_REPOSITORY)
    private readonly temaRepo: TemaForoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(command: CrearTemaCommand): Promise<TemaForo> {
    const autor = await this.usuarioRepo.findById(command.autorId);
    if (!autor) throw new NotFoundDomainError('Usuario no encontrado');

    const tema = TemaForo.crear(uuid(), {
      autorId: autor.id,
      autorNombre: autor.nombre,
      titulo: command.titulo,
      texto: command.texto,
      categoria: command.categoria,
    });
    await this.temaRepo.save(tema);
    return tema;
  }
}
