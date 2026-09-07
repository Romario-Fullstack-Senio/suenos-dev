import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { RespuestaForo } from '../domain/respuesta-foro.entity';
import { TEMA_FORO_REPOSITORY, TemaForoRepository } from '../domain/tema-foro.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

interface ResponderTemaCommand {
  temaId: string;
  autorId: string;
  autorEsAdmin: boolean;
  texto: string;
}

@Injectable()
export class ResponderTemaUseCase {
  constructor(
    @Inject(TEMA_FORO_REPOSITORY)
    private readonly temaRepo: TemaForoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(command: ResponderTemaCommand): Promise<void> {
    const tema = await this.temaRepo.findById(command.temaId);
    if (!tema) throw new NotFoundDomainError('Tema no encontrado');

    const autor = await this.usuarioRepo.findById(command.autorId);
    if (!autor) throw new NotFoundDomainError('Usuario no encontrado');

    const respuesta = RespuestaForo.crear(uuid(), {
      autorId: command.autorId,
      autorNombre: autor.nombre,
      autorEsAdmin: command.autorEsAdmin,
      texto: command.texto,
    });
    tema.agregarRespuesta(respuesta);
    await this.temaRepo.save(tema);
  }
}
