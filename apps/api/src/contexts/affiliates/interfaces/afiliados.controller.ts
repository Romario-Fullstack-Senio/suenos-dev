import { Controller, Get, Patch, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ObtenerResumenAfiliadoUseCase } from '../application/obtener-resumen-afiliado.use-case';
import { ListarComisionesAdminUseCase } from '../application/listar-comisiones-admin.use-case';
import { MarcarComisionPagadaUseCase } from '../application/marcar-comision-pagada.use-case';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('afiliados')
@UseGuards(JwtAuthGuard)
export class AfiliadosController {
  constructor(
    private readonly obtenerResumenUC: ObtenerResumenAfiliadoUseCase,
    private readonly listarComisionesAdminUC: ListarComisionesAdminUseCase,
    private readonly marcarPagadaUC: MarcarComisionPagadaUseCase,
  ) {}

  // Cualquier usuario logueado es "afiliado" en potencia — no hay un
  // paso de "inscribirse al programa": su propio id ES el código de
  // referido (?ref=<usuarioId>), y este endpoint resume lo que ganó.
  @Get('resumen')
  async miResumen(@Req() req: AuthenticatedRequest) {
    return this.obtenerResumenUC.execute(req.user.id);
  }

  @Get('comisiones')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async comisiones() {
    return this.listarComisionesAdminUC.execute();
  }

  @Patch('comisiones/:id/pagar')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async pagar(@Param('id') id: string) {
    await this.marcarPagadaUC.execute(id);
    return { message: 'Comisión marcada como pagada' };
  }
}
