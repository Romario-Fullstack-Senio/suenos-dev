import { Controller, Get, Post, Delete, Param, Body, Req, Inject, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../domain/usuario.repository.port';
import type { Request } from 'express';
import { RegistrarUsuarioUseCase } from '../application/registrar-usuario.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { RefrescarTokenUseCase } from '../application/refrescar-token.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { SolicitarResetPasswordUseCase } from '../application/solicitar-reset-password.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import { VerificarEmailUseCase } from '../application/verificar-email.use-case';
import { ReenviarVerificacionUseCase } from '../application/reenviar-verificacion.use-case';
import { Iniciar2FAUseCase } from '../application/iniciar-2fa.use-case';
import { Confirmar2FAUseCase } from '../application/confirmar-2fa.use-case';
import { Desactivar2FAUseCase } from '../application/desactivar-2fa.use-case';
import { ConfirmarLoginDosFactoresUseCase } from '../application/confirmar-login-2fa.use-case';
import { ListarSesionesUseCase } from '../application/listar-sesiones.use-case';
import { RevocarSesionUseCase } from '../application/revocar-sesion.use-case';
import { RegistrarDto } from './dto/registrar.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Confirmar2FADto, Desactivar2FADto, ConfirmarLogin2FADto } from './dto/two-factor.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registrarUC: RegistrarUsuarioUseCase,
    private readonly loginUC: LoginUseCase,
    private readonly refrescarTokenUC: RefrescarTokenUseCase,
    private readonly logoutUC: LogoutUseCase,
    private readonly solicitarResetUC: SolicitarResetPasswordUseCase,
    private readonly resetPasswordUC: ResetPasswordUseCase,
    private readonly verificarEmailUC: VerificarEmailUseCase,
    private readonly reenviarVerificacionUC: ReenviarVerificacionUseCase,
    private readonly iniciar2FAUC: Iniciar2FAUseCase,
    private readonly confirmar2FAUC: Confirmar2FAUseCase,
    private readonly desactivar2FAUC: Desactivar2FAUseCase,
    private readonly confirmarLogin2FAUC: ConfirmarLoginDosFactoresUseCase,
    private readonly listarSesionesUC: ListarSesionesUseCase,
    private readonly revocarSesionUC: RevocarSesionUseCase,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  @Post('registro')
  async registro(@Body() dto: RegistrarDto) {
    return this.registrarUC.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.loginUC.execute({ ...dto, userAgent: req.headers['user-agent'] ?? null });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.refrescarTokenUC.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.logoutUC.execute(dto.refreshToken);
    return { message: 'Sesión cerrada correctamente' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.solicitarResetUC.execute(dto.email);
    // Respuesta genérica siempre, exista o no la cuenta — no confirmamos ni
    // negamos si un email está registrado.
    return { message: 'Si el email existe, vas a recibir un enlace para restablecer tu contraseña' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUC.execute(dto.token, dto.password);
    return { message: 'Contraseña actualizada correctamente' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.verificarEmailUC.execute(dto.token);
    return { message: 'Email verificado correctamente' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ForgotPasswordDto) {
    await this.reenviarVerificacionUC.execute(dto.email);
    return { message: 'Si el email existe y no está verificado, vas a recibir un nuevo enlace' };
  }

  // --- Verificación en dos pasos (TOTP) ---

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  async estado2FA(@Req() req: AuthenticatedRequest) {
    const usuario = await this.usuarioRepo.findById(req.user.id);
    return { enabled: usuario?.twoFactorEnabled ?? false };
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async iniciar2FA(@Req() req: AuthenticatedRequest) {
    return this.iniciar2FAUC.execute(req.user.id);
  }

  @Post('2fa/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmar2FA(@Body() dto: Confirmar2FADto, @Req() req: AuthenticatedRequest) {
    return this.confirmar2FAUC.execute(req.user.id, dto.codigo);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async desactivar2FA(@Body() dto: Desactivar2FADto, @Req() req: AuthenticatedRequest) {
    await this.desactivar2FAUC.execute(req.user.id, dto.password);
    return { message: 'Verificación en dos pasos desactivada' };
  }

  // Sin guard: se llama DESPUÉS del login por contraseña pero ANTES de
  // tener un access token real — el tempToken (purpose: 'two-factor-pending')
  // es lo que autoriza este paso, no un Bearer normal.
  @Post('2fa/login')
  @HttpCode(HttpStatus.OK)
  async confirmarLogin2FA(@Body() dto: ConfirmarLogin2FADto, @Req() req: Request) {
    return this.confirmarLogin2FAUC.execute({
      tempToken: dto.tempToken,
      codigo: dto.codigo,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  // --- Sesiones activas ---

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async sesiones(@Req() req: AuthenticatedRequest) {
    const sesiones = await this.listarSesionesUC.execute(req.user.id);
    return sesiones.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expira: s.expira,
    }));
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revocarSesion(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.revocarSesionUC.execute(req.user.id, id);
    return { message: 'Sesión cerrada' };
  }
}
