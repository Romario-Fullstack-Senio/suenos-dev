import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RegistrarUsuarioUseCase } from '../application/registrar-usuario.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { RegistrarDto } from './dto/registrar.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registrarUC: RegistrarUsuarioUseCase,
    private readonly loginUC: LoginUseCase,
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
}
