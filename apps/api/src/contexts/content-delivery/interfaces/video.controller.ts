import { Controller, Post, Get, Body, Param, Query, Req, Res, Inject, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { SubirVideoUseCase } from '../application/subir-video.use-case';
import { VerificarAccesoVideoUseCase } from '../application/verificar-acceso-video.use-case';
import { VIDEO_STORAGE, VideoStorage } from '../domain/progreso-leccion.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('videos')
export class VideoController {
  constructor(
    private readonly subirVideoUseCase: SubirVideoUseCase,
    private readonly verificarAccesoUseCase: VerificarAccesoVideoUseCase,
    private readonly jwtService: JwtService,
    @Inject(VIDEO_STORAGE)
    private readonly videoStorage: VideoStorage,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async upload(@Body() body: { file: string; leccionId: string }) {
    // El frontend manda una data URL completa (readAsDataURL: "data:video/mp4;
    // base64,AAAA..."), no base64 puro. Sin sacar el prefijo, Buffer.from
    // decodifica la data URL entera como si todo fuera base64, corrompiendo
    // los primeros bytes del archivo — ffmpeg fallaba con "moov atom not
    // found" en CUALQUIER video real subido por esta ruta hasta ahora.
    const base64 = body.file.includes(',') ? body.file.split(',')[1] : body.file;
    const buffer = Buffer.from(base64, 'base64');
    const url = await this.subirVideoUseCase.execute(buffer, body.leccionId);
    return { url };
  }

  // Sin @UseGuards: una vista previa gratuita debe poder verse sin login.
  // El control de acceso real (inscripción / vista previa / dueño / admin)
  // lo hace VerificarAccesoVideoUseCase acá abajo, leyendo el token a mano
  // (header Authorization para hls.js, o ?token= en la URL como fallback
  // para el reproductor HLS nativo de Safari, que no manda headers custom).
  @Get('hls/:leccionId/:filename')
  async serveHls(
    @Param('leccionId') leccionId: string,
    @Param('filename') filename: string,
    @Query('token') tokenQuery: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const rawToken = this.extraerToken(req, tokenQuery);
    const usuario = this.verificarToken(rawToken);

    const { permitido, existe } = await this.verificarAccesoUseCase.execute({
      leccionId,
      usuarioId: usuario?.id,
      usuarioRol: usuario?.rol,
    });

    if (!existe) {
      throw new NotFoundException('Lección no encontrada');
    }
    if (!permitido) {
      throw new ForbiddenException('No tenés acceso a este contenido — inscribite en el curso para verlo');
    }

    const objeto = await this.videoStorage.getObject(leccionId, filename);
    if (!objeto) {
      throw new NotFoundException('Video segment not found');
    }

    res.set({
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });

    if (filename.endsWith('.m3u8')) {
      // Reescribe el manifest para que cada segmento lleve el token en la
      // URL — así el reproductor nativo de Safari (que resuelve las rutas
      // relativas del manifest sin heredar query params ni poder mandar
      // headers custom) también puede pedir los .ts autenticado.
      const chunks: Buffer[] = [];
      for await (const chunk of objeto.stream as any) chunks.push(chunk as Buffer);
      const contenido = Buffer.concat(chunks).toString('utf-8');
      const reescrito = rawToken
        ? contenido
            .split('\n')
            .map(linea => (linea && !linea.startsWith('#') ? `${linea}?token=${rawToken}` : linea))
            .join('\n')
        : contenido;
      res.set('Content-Type', objeto.contentType);
      res.send(reescrito);
      return;
    }

    res.set('Content-Type', objeto.contentType);
    objeto.stream.pipe(res);
  }

  private extraerToken(req: Request, tokenQuery?: string): string | null {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
    return tokenQuery ?? null;
  }

  private verificarToken(rawToken: string | null): { id: string; rol: string } | null {
    if (!rawToken) return null;
    try {
      const payload = this.jwtService.verify(rawToken);
      if (payload.purpose === 'session-hint') return null; // ver JwtStrategy
      return { id: payload.sub, rol: payload.rol };
    } catch {
      return null; // token vencido/inválido → tratamos como anónimo
    }
  }
}
