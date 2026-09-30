import { ConfigService } from '@nestjs/config';

/**
 * Secreto para firmar/verificar JWTs. En desarrollo cae a 'dev-secret' para
 * no obligar a configurar nada localmente, pero en producción (NODE_ENV=
 * production, que es lo que corre tanto prod como preprod) falta de
 * JWT_SECRET tumba el arranque: antes caía en silencio al mismo 'dev-secret'
 * público del repo, y con él cualquiera podía firmar un token con rol admin.
 */
export function obtenerJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET no está configurado — la API no arranca sin él en producción');
  }
  return 'dev-secret';
}
