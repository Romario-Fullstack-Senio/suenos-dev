import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3001/api/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: Error | null, user?: unknown) => void,
  ): void {
    const { id, emails, displayName } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      done(new Error('No se pudo obtener el email de Google'));
      return;
    }

    done(null, {
      email,
      nombre: displayName || email.split('@')[0],
      provider: 'google',
      providerId: id,
    });
  }
}
