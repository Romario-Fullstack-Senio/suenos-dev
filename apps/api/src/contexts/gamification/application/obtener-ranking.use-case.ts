import { Inject, Injectable } from '@nestjs/common';
import {
  PERFIL_GAMIFICACION_REPOSITORY,
  PerfilGamificacionRepository,
} from '../domain/perfil-gamificacion.repository.port';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';

export interface RankingItemDto {
  usuarioId: string;
  nombre: string;
  puntos: number;
}

const LIMITE_DEFAULT = 10;

/** Top N de estudiantes por puntos — cruza gamification (puntos) con
 * identity (nombre para mostrar), mismo criterio que
 * InstructorController/AdminController: una lectura agregada entre
 * contextos no necesita pasar por eventos. */
@Injectable()
export class ObtenerRankingUseCase {
  constructor(
    @Inject(PERFIL_GAMIFICACION_REPOSITORY)
    private readonly perfilRepo: PerfilGamificacionRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(limite = LIMITE_DEFAULT): Promise<RankingItemDto[]> {
    const top = await this.perfilRepo.topPorPuntos(limite);
    const usuarios = await Promise.all(top.map((entry) => this.usuarioRepo.findById(entry.usuarioId)));

    return top.map((entry, i) => ({
      usuarioId: entry.usuarioId,
      nombre: usuarios[i]?.nombre ?? 'Usuario',
      puntos: entry.puntos,
    }));
  }
}
