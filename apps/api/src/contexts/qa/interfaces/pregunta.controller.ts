import { Body, Controller, Get, Post, Patch, Delete, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CrearPreguntaUseCase } from '../application/crear-pregunta.use-case';
import { ResponderPreguntaUseCase } from '../application/responder-pregunta.use-case';
import { ListarPreguntasUseCase } from '../application/listar-preguntas.use-case';
import { EliminarPreguntaUseCase } from '../application/eliminar-pregunta.use-case';
import { MarcarResueltaUseCase } from '../application/marcar-resuelta.use-case';
import { ReportarPreguntaUseCase } from '../application/reportar-pregunta.use-case';
import { RestaurarPreguntaUseCase } from '../application/restaurar-pregunta.use-case';
import { ListarPreguntasReportadasUseCase } from '../application/listar-preguntas-reportadas.use-case';
import { Pregunta } from '../domain/pregunta.entity';
import { CrearPreguntaDto } from './dto/crear-pregunta.dto';
import { CrearRespuestaDto } from './dto/crear-respuesta.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

function mapPregunta(p: Pregunta) {
  return {
    id: p.id,
    leccionId: p.leccionId,
    cursoId: p.cursoId,
    autorId: p.autorId,
    autorNombre: p.autorNombre,
    autorEsInstructor: p.autorEsInstructor,
    texto: p.texto,
    resuelta: p.resuelta,
    createdAt: p.createdAt,
    totalReportes: p.totalReportes,
    oculta: p.oculta,
    respuestas: p.respuestas.map((r) => ({
      id: r.id,
      autorId: r.autorId,
      autorNombre: r.autorNombre,
      autorEsInstructor: r.autorEsInstructor,
      texto: r.texto,
      createdAt: r.createdAt,
    })),
  };
}

@Controller()
export class PreguntaController {
  constructor(
    private readonly crearPreguntaUC: CrearPreguntaUseCase,
    private readonly responderPreguntaUC: ResponderPreguntaUseCase,
    private readonly listarPreguntasUC: ListarPreguntasUseCase,
    private readonly eliminarPreguntaUC: EliminarPreguntaUseCase,
    private readonly marcarResueltaUC: MarcarResueltaUseCase,
    private readonly reportarUC: ReportarPreguntaUseCase,
    private readonly restaurarUC: RestaurarPreguntaUseCase,
    private readonly listarReportadasUC: ListarPreguntasReportadasUseCase,
    private readonly jwtService: JwtService,
  ) {}

  // Panel de moderación del admin — no hay otra ruta GET 'preguntas/:algo'
  // con la que pueda chocar (el resto de 'preguntas/:id/...' son POST/PATCH/DELETE).
  @Get('preguntas/reportadas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listarReportadas() {
    const preguntas = await this.listarReportadasUC.execute();
    return preguntas.map(mapPregunta);
  }

  // Sin @UseGuards: una lección de vista previa gratuita también debe poder
  // mostrar su Q&A sin login (mismo criterio que VideoController.serveHls).
  @Get('lecciones/:leccionId/preguntas')
  async listar(@Param('leccionId') leccionId: string, @Req() req: Request) {
    const usuario = this.verificarTokenOpcional(req);
    const preguntas = await this.listarPreguntasUC.execute({
      leccionId,
      usuarioId: usuario?.id,
      usuarioRol: usuario?.rol,
    });
    return preguntas.map(mapPregunta);
  }

  @Post('lecciones/:leccionId/preguntas')
  @UseGuards(JwtAuthGuard)
  async crear(
    @Param('leccionId') leccionId: string,
    @Body() dto: CrearPreguntaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.crearPreguntaUC.execute({
      leccionId,
      autorId: req.user.id,
      autorRol: req.user.rol,
      texto: dto.texto,
    });
  }

  @Post('preguntas/:id/respuestas')
  @UseGuards(JwtAuthGuard)
  async responder(
    @Param('id') id: string,
    @Body() dto: CrearRespuestaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.responderPreguntaUC.execute({
      preguntaId: id,
      autorId: req.user.id,
      autorRol: req.user.rol,
      texto: dto.texto,
    });
  }

  @Patch('preguntas/:id/resolver')
  @UseGuards(JwtAuthGuard)
  async marcarResuelta(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.marcarResueltaUC.execute({
      preguntaId: id,
      resuelta: true,
      callerId: req.user.id,
      callerRol: req.user.rol,
    });
    return { message: 'Pregunta marcada como resuelta' };
  }

  @Delete('preguntas/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.eliminarPreguntaUC.execute({
      preguntaId: id,
      callerId: req.user.id,
      callerRol: req.user.rol,
    });
    return { message: 'Pregunta eliminada correctamente' };
  }

  @Post('preguntas/:id/reportar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reportar(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const { oculta } = await this.reportarUC.execute({ preguntaId: id, usuarioId: req.user.id });
    return {
      message: oculta
        ? 'Pregunta reportada — se ocultó automáticamente por la cantidad de reportes'
        : 'Pregunta reportada, gracias por avisarnos',
    };
  }

  @Post('preguntas/:id/restaurar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async restaurar(@Param('id') id: string) {
    await this.restaurarUC.execute(id);
    return { message: 'Pregunta restaurada' };
  }

  private verificarTokenOpcional(req: Request): { id: string; rol: string } | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    try {
      const payload = this.jwtService.verify(header.slice('Bearer '.length));
      if (payload.purpose === 'session-hint') return null;
      return { id: payload.sub, rol: payload.rol };
    } catch {
      return null;
    }
  }
}
