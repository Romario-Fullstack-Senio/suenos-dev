import { Body, Controller, Get, Post, Delete, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { CrearCuponUseCase } from '../application/crear-cupon.use-case';
import { ValidarCuponUseCase } from '../application/validar-cupon.use-case';
import { ListarCuponesUseCase } from '../application/listar-cupones.use-case';
import { DesactivarCuponUseCase } from '../application/desactivar-cupon.use-case';
import { CrearCuponDto } from './dto/crear-cupon.dto';
import { ValidarCuponDto } from './dto/validar-cupon.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('cupones')
export class CuponController {
  constructor(
    private readonly crearCuponUC: CrearCuponUseCase,
    private readonly validarCuponUC: ValidarCuponUseCase,
    private readonly listarCuponesUC: ListarCuponesUseCase,
    private readonly desactivarCuponUC: DesactivarCuponUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async crear(@Body() dto: CrearCuponDto, @Req() req: AuthenticatedRequest) {
    return this.crearCuponUC.execute({ ...dto, callerRol: req.user.rol });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listar(@Req() req: AuthenticatedRequest) {
    return this.listarCuponesUC.execute(req.user.rol);
  }

  // Público (requiere estar logueado, cualquier rol) — el estudiante lo usa
  // en el checkout para previsualizar el descuento antes de pagar.
  @Post('validar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validar(@Body() dto: ValidarCuponDto) {
    return this.validarCuponUC.execute(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async desactivar(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.desactivarCuponUC.execute(id, req.user.rol);
    return { message: 'Cupón desactivado correctamente' };
  }
}
