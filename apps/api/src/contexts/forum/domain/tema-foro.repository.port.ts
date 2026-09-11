import { TemaForo, CategoriaForo } from './tema-foro.entity';

export const TEMA_FORO_REPOSITORY = 'TEMA_FORO_REPOSITORY';

export interface TemaForoRepository {
  save(tema: TemaForo): Promise<void>;
  findById(id: string): Promise<TemaForo | null>;
  /** Listado público — ocultos excluidos ya acá (no en el caso de uso),
   * para que el listado nunca traiga de más. */
  findVisibles(categoria?: CategoriaForo): Promise<TemaForo[]>;
  /** Todos, ocultos incluidos — panel de moderación del admin. */
  findAll(): Promise<TemaForo[]>;
  delete(id: string): Promise<void>;
}
