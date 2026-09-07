import { PerfilGamificacion } from './perfil-gamificacion.entity';

export const PERFIL_GAMIFICACION_REPOSITORY = 'PERFIL_GAMIFICACION_REPOSITORY';

export interface RankingEntry {
  usuarioId: string;
  puntos: number;
}

export interface PerfilGamificacionRepository {
  save(perfil: PerfilGamificacion): Promise<void>;
  findByUsuarioId(usuarioId: string): Promise<PerfilGamificacion | null>;
  /** Top N por puntos, para el ranking — solo id y puntos (el nombre del
   * usuario se resuelve aparte, ver ObtenerRankingUseCase) para no acoplar
   * este contexto a cómo identity guarda el nombre. */
  topPorPuntos(limite: number): Promise<RankingEntry[]>;
}
