import { RefreshToken } from './refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

export interface RefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findById(id: string): Promise<RefreshToken | null>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  /** Sesiones activas (no revocadas, no vencidas) de un usuario — una por
   * familyId, para la pantalla "sesiones activas" de /perfil. */
  findActivasByUsuario(usuarioId: string): Promise<RefreshToken[]>;
  revocarTodosDeUsuario(usuarioId: string): Promise<void>;
}
