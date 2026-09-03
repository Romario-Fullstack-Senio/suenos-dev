import { createHash } from 'crypto';

/** El refresh token es un valor aleatorio de alta entropía (no una contraseña
 * elegida por un humano), así que un hash simple y rápido (sha256) alcanza —
 * a diferencia de una contraseña, no hace falta bcrypt/argon2 con salt. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
