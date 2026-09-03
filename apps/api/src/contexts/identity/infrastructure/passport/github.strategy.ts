import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID', ''),
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET', ''),
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL', 'http://localhost:3001/api/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const { id, emails, displayName, username } = profile;
    let email = emails?.[0]?.value;

    // GitHub sometimes doesn't include the email in the profile
    if (!email && accessToken) {
      try {
        const response = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const emailsData = await response.json() as any[];
        const primaryEmail = emailsData.find((e: any) => e.primary && e.verified);
        if (primaryEmail) {
          email = primaryEmail.email;
        }
      } catch {
        // If we can't fetch the email, we'll use a placeholder
      }
    }

    if (!email) {
      done(new Error('No se pudo obtener el email de GitHub. Asegúrate de tener un email público o verificado.'));
      return;
    }

    const nombre = displayName || username || email.split('@')[0];

    done(null, {
      email,
      nombre,
      provider: 'github',
      providerId: String(id),
    });
  }
}
