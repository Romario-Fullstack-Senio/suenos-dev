import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RegistrarUsuarioUseCase } from '../application/registrar-usuario.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { RefrescarTokenUseCase } from '../application/refrescar-token.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { SolicitarResetPasswordUseCase } from '../application/solicitar-reset-password.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import { VerificarEmailUseCase } from '../application/verificar-email.use-case';
import { ReenviarVerificacionUseCase } from '../application/reenviar-verificacion.use-case';
import { RegistrarDto } from './dto/registrar.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

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
  ) {}

  @Post('registro')
  async registro(@Body() dto: RegistrarDto) {
    return this.registrarUC.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.loginUC.execute(dto);
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
}
