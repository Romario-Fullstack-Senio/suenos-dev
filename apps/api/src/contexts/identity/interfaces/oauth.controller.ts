import { Controller, Get, UseGuards, Req, Res, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { LoginConOAuthUseCase } from '../application/login-con-oauth.use-case';
import { AuthProviderTipo } from '../domain/auth-provider.value-object';

/**
 * Los tokens viajan en el fragmento (#), no en la query string: el navegador
 * nunca manda el fragmento al servidor (no queda en logs de Caddy/Next ni de
 * ningún proxy) ni lo incluye en el header Referer. Antes iban como ?token=
 * — incluido el refreshToken de 30 días. /auth/callback además borra el
 * fragmento de la barra de direcciones apenas lo lee.
 */
function urlDeCallback(
  frontendUrl: string,
  result: { token: string; refreshToken: string; sessionToken: string; usuario: { avatarUrl?: string | null } },
): string {
  const params = new URLSearchParams({
    token: result.token,
    refreshToken: result.refreshToken,
    sessionToken: result.sessionToken,
  });
  if (result.usuario.avatarUrl) params.set('avatarUrl', result.usuario.avatarUrl);
  return `${frontendUrl}/auth/callback#${params.toString()}`;
}

@Controller('auth')
export class OAuthController {
  constructor(
    private readonly loginConOAuthUC: LoginConOAuthUseCase,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    const frontendUrl = this.config.get('APP_URL', 'http://localhost:3000');
    try {
      const result = await this.loginConOAuthUC.execute({
        email: req.user.email,
        nombre: req.user.nombre,
        provider: AuthProviderTipo.GOOGLE,
        providerId: req.user.providerId,
        userAgent: req.headers['user-agent'] ?? null,
        avatarUrl: req.user.avatarUrl ?? null,
      });
      res.redirect(urlDeCallback(frontendUrl, result));
    } catch (error) {
      res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any, @Res() res: any) {
    const frontendUrl = this.config.get('APP_URL', 'http://localhost:3000');
    try {
      const result = await this.loginConOAuthUC.execute({
        email: req.user.email,
        nombre: req.user.nombre,
        provider: AuthProviderTipo.GITHUB,
        providerId: req.user.providerId,
        userAgent: req.headers['user-agent'] ?? null,
        avatarUrl: req.user.avatarUrl ?? null,
      });
      res.redirect(urlDeCallback(frontendUrl, result));
    } catch (error) {
      res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
    }
  }
}
