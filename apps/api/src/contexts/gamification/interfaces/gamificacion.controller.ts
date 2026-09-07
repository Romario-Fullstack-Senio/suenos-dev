import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ObtenerPerfilGamificacionUseCase } from '../application/obtener-perfil-gamificacion.use-case';
import { ObtenerRankingUseCase } from '../application/obtener-ranking.use-case';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('gamificacion')
export class GamificacionController {
  constructor(
    private readonly obtenerPerfilUC: ObtenerPerfilGamificacionUseCase,
    private readonly obtenerRankingUC: ObtenerRankingUseCase,
  ) {}

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async miPerfil(@Req() req: AuthenticatedRequest) {
    return this.obtenerPerfilUC.execute(req.user.id);
  }

  // Público (sin JwtAuthGuard): un ranking de puntos no es información
  // sensible y mostrarlo sin login es lo que lo hace útil como vidriera
  // ("mirá lo que te perdés"), igual que el catálogo de cursos.
  @Get('ranking')
  async ranking(@Query('limite') limite?: string) {
    const n = limite ? Math.min(Math.max(parseInt(limite, 10) || 10, 1), 50) : undefined;
    return this.obtenerRankingUC.execute(n);
  }
}
