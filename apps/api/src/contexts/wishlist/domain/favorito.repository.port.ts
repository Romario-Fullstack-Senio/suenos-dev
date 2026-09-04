import { Favorito } from './favorito.entity';

export const FAVORITO_REPOSITORY = 'FAVORITO_REPOSITORY';

export interface FavoritoRepository {
  save(favorito: Favorito): Promise<void>;
  findByUsuarioYCurso(usuarioId: string, cursoId: string): Promise<Favorito | null>;
  findByUsuario(usuarioId: string): Promise<Favorito[]>;
  delete(id: string): Promise<void>;
}
