import { RefreshToken } from './refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

export interface RefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revocarTodosDeUsuario(usuarioId: string): Promise<void>;
}
