import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../contexts/identity/domain/usuario.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../contexts/catalog/domain/curso.repository.port';
import { INSCRIPCION_REPOSITORY, InscripcionRepository } from '../contexts/enrollment/domain/inscripcion.repository.port';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepository: InscripcionRepository,
  ) {}

  @Get('stats')
  async getStats() {
    const [usuarios, cursos, inscripciones] = await Promise.all([
      this.usuarioRepository.findAll(),
      this.cursoRepository.findAll(),
      this.inscripcionRepository.findAll(),
    ]);

    return {
      totalUsuarios: usuarios.length,
      totalCursos: cursos.length,
      totalInscripciones: inscripciones.length,
    };
  }
}
