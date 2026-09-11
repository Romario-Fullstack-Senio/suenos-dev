import { Body, Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { CrearTemaUseCase } from '../application/crear-tema.use-case';
import { ResponderTemaUseCase } from '../application/responder-tema.use-case';
import { ListarTemasUseCase } from '../application/listar-temas.use-case';
import { ObtenerTemaUseCase } from '../application/obtener-tema.use-case';
import { EliminarTemaUseCase } from '../application/eliminar-tema.use-case';
import { FijarTemaUseCase } from '../application/fijar-tema.use-case';
import { CerrarTemaUseCase } from '../application/cerrar-tema.use-case';
import { ReportarTemaUseCase } from '../application/reportar-tema.use-case';
import { RestaurarTemaUseCase } from '../application/restaurar-tema.use-case';
import { ListarTemasReportadosUseCase } from '../application/listar-temas-reportados.use-case';
import { TemaForo, CategoriaForo } from '../domain/tema-foro.entity';
import { CrearTemaDto } from './dto/crear-tema.dto';
import { CrearRespuestaForoDto } from './dto/crear-respuesta-foro.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

function mapTema(t: TemaForo) {
  return {
    id: t.id,
    autorId: t.autorId,
    autorNombre: t.autorNombre,
    titulo: t.titulo,
    texto: t.texto,
    categoria: t.categoria,
    fijado: t.fijado,
    cerrado: t.cerrado,
    createdAt: t.createdAt,
    totalReportes: t.totalReportes,
    oculta: t.oculta,
    totalRespuestas: t.respuestas.length,
    respuestas: t.respuestas.map((r) => ({
      id: r.id,
      autorId: r.autorId,
      autorNombre: r.autorNombre,
      autorEsAdmin: r.autorEsAdmin,
      texto: r.texto,
      createdAt: r.createdAt,
    })),
  };
}

@Controller('foro')
export class ForoController {
  constructor(
    private readonly crearTemaUC: CrearTemaUseCase,
    private readonly responderTemaUC: ResponderTemaUseCase,
    private readonly listarTemasUC: ListarTemasUseCase,
    private readonly obtenerTemaUC: ObtenerTemaUseCase,
    private readonly eliminarTemaUC: EliminarTemaUseCase,
    private readonly fijarTemaUC: FijarTemaUseCase,
    private readonly cerrarTemaUC: CerrarTemaUseCase,
    private readonly reportarTemaUC: ReportarTemaUseCase,
    private readonly restaurarTemaUC: RestaurarTemaUseCase,
    private readonly listarReportadosUC: ListarTemasReportadosUseCase,
  ) {}

  // Panel de moderación — antes de ':id' para no chocar (ver mismo
  // criterio en PreguntaController).
  @Get('temas/reportados')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listarReportados() {
    const temas = await this.listarReportadosUC.execute();
    return temas.map(mapTema);
  }

  // Público: un foro que exige login para mirar no cumple su función de
  // vidriera — igual que el catálogo de cursos y el ranking de gamificación.
  @Get('temas')
  async listar(@Query('categoria') categoria?: string) {
    const temas = await this.listarTemasUC.execute(categoria as CategoriaForo | undefined);
    return temas.map(mapTema);
  }

  @Get('temas/:id')
  async obtener(@Param('id') id: string) {
    const tema = await this.obtenerTemaUC.execute(id);
    return mapTema(tema);
  }

  @Post('temas')
  @UseGuards(JwtAuthGuard)
  async crear(@Body() dto: CrearTemaDto, @Req() req: AuthenticatedRequest) {
    const tema = await this.crearTemaUC.execute({
      autorId: req.user.id,
      titulo: dto.titulo,
      texto: dto.texto,
      categoria: dto.categoria,
    });
    return mapTema(tema);
  }

  @Post('temas/:id/respuestas')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async responder(@Param('id') id: string, @Body() dto: CrearRespuestaForoDto, @Req() req: AuthenticatedRequest) {
    await this.responderTemaUC.execute({
      temaId: id,
      autorId: req.user.id,
      autorEsAdmin: req.user.rol === 'admin',
      texto: dto.texto,
    });
    return { message: 'Respuesta publicada' };
  }

  @Delete('temas/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.eliminarTemaUC.execute({ temaId: id, callerId: req.user.id, callerEsAdmin: req.user.rol === 'admin' });
    return { message: 'Tema eliminado correctamente' };
  }

  @Patch('temas/:id/fijar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async fijar(@Param('id') id: string, @Body('fijado') fijado: boolean) {
    await this.fijarTemaUC.execute(id, !!fijado);
    return { message: fijado ? 'Tema fijado' : 'Tema desfijado' };
  }

  @Patch('temas/:id/cerrar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async cerrar(@Param('id') id: string, @Body('cerrado') cerrado: boolean) {
    await this.cerrarTemaUC.execute(id, !!cerrado);
    return { message: cerrado ? 'Tema cerrado' : 'Tema reabierto' };
  }

  @Post('temas/:id/reportar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reportar(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const { oculta } = await this.reportarTemaUC.execute({ temaId: id, usuarioId: req.user.id });
    return {
      message: oculta
        ? 'Tema reportado — se ocultó automáticamente por la cantidad de reportes'
        : 'Tema reportado, gracias por avisarnos',
    };
  }

  @Post('temas/:id/restaurar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async restaurar(@Param('id') id: string) {
    await this.restaurarTemaUC.execute(id);
    return { message: 'Tema restaurado' };
  }
}
