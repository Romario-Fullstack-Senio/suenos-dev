import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../contexts/identity/domain/usuario.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../contexts/catalog/domain/curso.repository.port';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
  ) {}

  @Get('stats')
  async getStats() {
    const usuarios = await this.usuarioRepository.findAll();
    const cursos = await this.cursoRepository.findAll();

    return {
      totalUsuarios: usuarios.length,
      totalCursos: cursos.length,
      totalInscripciones: 0,
    };
  }
}
