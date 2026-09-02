import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CrearCursoUseCase } from '../application/crear-curso.use-case';
import { PublicarCursoUseCase } from '../application/publicar-curso.use-case';
import { AgregarModuloUseCase } from '../application/agregar-modulo.use-case';
import { AgregarLeccionUseCase } from '../application/agregar-leccion.use-case';
import { CrearCursoDto } from './dto/crear-curso.dto';
import { AgregarModuloDto } from './dto/agregar-modulo.dto';
import { AgregarLeccionDto } from './dto/agregar-leccion.dto';
import { Inject } from '@nestjs/common';
import { CURSO_REPOSITORY, CursoRepository } from '../domain/curso.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('cursos')
export class CursoController {
  constructor(
    private readonly crearCursoUC: CrearCursoUseCase,
    private readonly publicarCursoUC: PublicarCursoUseCase,
    private readonly agregarModuloUC: AgregarModuloUseCase,
    private readonly agregarLeccionUC: AgregarLeccionUseCase,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /** Invalida la caché de lectura del catálogo tras una escritura. TTL corto (30s)
   * como red de seguridad si algún camino de escritura no se cubre aquí. */
  private async invalidarCache(id?: string) {
    await this.cacheManager.del('/api/cursos');
    if (id) await this.cacheManager.del(`/api/cursos/${id}`);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  async findAll(@Query('instructorId') instructorId?: string) {
    const cursos = await this.cursoRepository.findAll();
    if (instructorId) {
      return cursos
        .filter(c => c.instructorId === instructorId)
        .map(c => ({
          id: c.id,
          titulo: c.titulo,
          descripcion: c.descripcion,
          slug: c.slug.value,
          precio: c.precio.value,
          estado: c.estado.value,
          instructorId: c.instructorId,
        }));
    }
    return cursos.map(c => ({
      id: c.id,
      titulo: c.titulo,
      descripcion: c.descripcion,
      slug: c.slug.value,
      precio: c.precio.value,
      estado: c.estado.value,
      instructorId: c.instructorId,
    }));
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  async findOne(@Param('id') id: string) {
    const curso = await this.cursoRepository.findById(id);
    if (!curso) {
      return { message: 'Curso no encontrado' };
    }
    return {
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      slug: curso.slug.value,
      precio: curso.precio.value,
      estado: curso.estado.value,
      instructorId: curso.instructorId,
      modulos: curso.modulos.map(m => ({
        id: m.id,
        titulo: m.titulo,
        orden: m.orden,
        lecciones: m.lecciones.map(l => ({
          id: l.id,
          titulo: l.titulo,
          orden: l.orden,
          duracionSegundos: l.duracionSegundos,
          videoUrl: l.videoUrl,
        })),
      })),
    };
  }

  @Get('slug/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  async findBySlug(@Param('slug') slug: string) {
    const curso = await this.cursoRepository.findBySlug(slug);
    if (!curso) {
      return { message: 'Curso no encontrado' };
    }
    return {
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      slug: curso.slug.value,
      precio: curso.precio.value,
      estado: curso.estado.value,
      instructorId: curso.instructorId,
      modulos: curso.modulos.map(m => ({
        id: m.id,
        titulo: m.titulo,
        orden: m.orden,
        lecciones: m.lecciones.map(l => ({
          id: l.id,
          titulo: l.titulo,
          orden: l.orden,
          duracionSegundos: l.duracionSegundos,
          videoUrl: l.videoUrl,
        })),
      })),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async crear(@Body() dto: CrearCursoDto) {
    const curso = await this.crearCursoUC.execute(dto);
    await this.invalidarCache();
    return curso;
  }

  @Post(':id/publicar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  @HttpCode(HttpStatus.OK)
  async publicar(@Param('id') id: string) {
    await this.publicarCursoUC.execute(id);
    await this.invalidarCache(id);
    return { message: 'Curso publicado correctamente' };
  }

  @Post(':id/modulos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async agregarModulo(@Param('id') cursoId: string, @Body() dto: AgregarModuloDto) {
    const result = await this.agregarModuloUC.execute({ ...dto, cursoId });
    await this.invalidarCache(cursoId);
    return result;
  }

  @Post(':id/modulos/:moduloId/lecciones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async agregarLeccion(
    @Param('id') cursoId: string,
    @Param('moduloId') moduloId: string,
    @Body() dto: AgregarLeccionDto,
  ) {
    const result = await this.agregarLeccionUC.execute({ ...dto, cursoId, moduloId });
    await this.invalidarCache(cursoId);
    return result;
  }
}
