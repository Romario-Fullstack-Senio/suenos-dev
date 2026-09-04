import { Controller, Get, Post, Delete, Param, Req, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { Favorito } from '../domain/favorito.entity';
import { FAVORITO_REPOSITORY, FavoritoRepository } from '../domain/favorito.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('favoritos')
@UseGuards(JwtAuthGuard)
export class FavoritoController {
  constructor(
    @Inject(FAVORITO_REPOSITORY)
    private readonly favoritoRepo: FavoritoRepository,
  ) {}

  @Get()
  async listar(@Req() req: AuthenticatedRequest) {
    const favoritos = await this.favoritoRepo.findByUsuario(req.user.id);
    return favoritos.map((f) => ({ cursoId: f.cursoId, createdAt: f.createdAt }));
  }

  @Post(':cursoId')
  async agregar(@Param('cursoId') cursoId: string, @Req() req: AuthenticatedRequest) {
    const existente = await this.favoritoRepo.findByUsuarioYCurso(req.user.id, cursoId);
    if (existente) {
      return { message: 'Ya estaba en tus favoritos' };
    }
    const favorito = Favorito.crear(randomUUID(), req.user.id, cursoId);
    await this.favoritoRepo.save(favorito);
    return { message: 'Agregado a favoritos' };
  }

  @Delete(':cursoId')
  @HttpCode(HttpStatus.OK)
  async quitar(@Param('cursoId') cursoId: string, @Req() req: AuthenticatedRequest) {
    const existente = await this.favoritoRepo.findByUsuarioYCurso(req.user.id, cursoId);
    if (existente) {
      await this.favoritoRepo.delete(existente.id);
    }
    return { message: 'Quitado de favoritos' };
  }
}
