import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Query, Req, HttpCode, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Request } from 'express';
import { CrearCursoUseCase } from '../application/crear-curso.use-case';
import { PublicarCursoUseCase } from '../application/publicar-curso.use-case';
import { AgregarModuloUseCase } from '../application/agregar-modulo.use-case';
import { AgregarLeccionUseCase } from '../application/agregar-leccion.use-case';
import { SubirImagenCursoUseCase } from '../application/subir-imagen-curso.use-case';
import { EditarCursoUseCase } from '../application/editar-curso.use-case';
import { CambiarEstadoCursoUseCase } from '../application/cambiar-estado-curso.use-case';
import { EliminarCursoUseCase } from '../application/eliminar-curso.use-case';
import { CrearCursoDto } from './dto/crear-curso.dto';
import { AgregarModuloDto } from './dto/agregar-modulo.dto';
import { AgregarLeccionDto } from './dto/agregar-leccion.dto';
import { ActualizarCursoDto } from './dto/actualizar-curso.dto';
import { CambiarEstadoCursoDto } from './dto/cambiar-estado-curso.dto';
import { Inject } from '@nestjs/common';
import { CURSO_REPOSITORY, CursoRepository, BuscarCursosFiltros } from '../domain/curso.repository.port';
import { Curso } from '../domain/curso.entity';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../identity/domain/usuario.repository.port';
import { INSCRIPCION_REPOSITORY, InscripcionRepository } from '../../enrollment/domain/inscripcion.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('cursos')
export class CursoController {
  constructor(
    private readonly crearCursoUC: CrearCursoUseCase,
    private readonly publicarCursoUC: PublicarCursoUseCase,
    private readonly agregarModuloUC: AgregarModuloUseCase,
    private readonly agregarLeccionUC: AgregarLeccionUseCase,
    private readonly subirImagenUC: SubirImagenCursoUseCase,
    private readonly editarCursoUC: EditarCursoUseCase,
    private readonly cambiarEstadoCursoUC: CambiarEstadoCursoUseCase,
    private readonly eliminarCursoUC: EliminarCursoUseCase,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepository: InscripcionRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /** Invalida la caché de lectura del catálogo tras una escritura. TTL corto (30s)
   * como red de seguridad si algún camino de escritura no se cubre aquí. */
  private async invalidarCache(id?: string, slug?: string) {
    await this.cacheManager.del('/api/cursos');
    if (id) await this.cacheManager.del(`/api/cursos/${id}`);
    if (slug) await this.cacheManager.del(`/api/cursos/slug/${slug}`);
  }

  /** Nombre del instructor para uno o varios cursos a la vez — batched con
   * Promise.all en vez de un JOIN cross-context (identity y catalog no se
   * conocen a nivel de DB, solo por id, siguiendo la convención DDD del
   * proyecto). */
  private async resolverNombresInstructores(instructorIds: string[]): Promise<Map<string, string>> {
    const ids = Array.from(new Set(instructorIds));
    const usuarios = await Promise.all(ids.map(id => this.usuarioRepository.findById(id)));
    const mapa = new Map<string, string>();
    ids.forEach((id, i) => mapa.set(id, usuarios[i]?.nombre ?? 'Instructor'));
    return mapa;
  }

  private async contarAlumnosPorCurso(cursoIds: string[]): Promise<Map<string, number>> {
    const conteos = await Promise.all(
      cursoIds.map(async id => {
        const inscripciones = await this.inscripcionRepository.findByCursoId(id);
        return inscripciones.filter(i => i.activa).length;
      }),
    );
    const mapa = new Map<string, number>();
    cursoIds.forEach((id, i) => mapa.set(id, conteos[i]));
    return mapa;
  }

  private mapearResumen(curso: Curso, instructorNombre: string, alumnosInscriptos: number) {
    return {
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      slug: curso.slug.value,
      precio: curso.precio.value,
      estado: curso.estado.value,
      instructorId: curso.instructorId,
      instructorNombre,
      imagenUrl: curso.imagenUrl,
      categoria: curso.categoria,
      nivel: curso.nivel,
      alumnosInscriptos,
    };
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  async findAll(
    @Query('instructorId') instructorId?: string,
    @Query('search') search?: string,
    @Query('categoria') categoria?: string,
    @Query('nivel') nivel?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (instructorId) {
      const cursos = (await this.cursoRepository.findAll()).filter(c => c.instructorId === instructorId);
      const nombres = await this.resolverNombresInstructores(cursos.map(c => c.instructorId));
      const alumnos = await this.contarAlumnosPorCurso(cursos.map(c => c.id));
      return cursos.map(c => this.mapearResumen(c, nombres.get(c.instructorId)!, alumnos.get(c.id) ?? 0));
    }

    const ordenarPor: BuscarCursosFiltros['ordenarPor'] =
      sort === 'precio_asc' || sort === 'precio_desc' ? sort : 'reciente';

    const pagina = Math.max(1, Number(page) || 1);
    // Tope de 100 para permitir que el sitemap pida "todo de una" sin abrir
    // la puerta a que cualquiera pida porPagina=999999999 y tire la DB abajo.
    const porPagina = Math.min(100, Math.max(1, Number(limit) || 12));

    const { cursos, total } = await this.cursoRepository.search({
      texto: search,
      categoria,
      nivel,
      ordenarPor,
      soloPublicados: true,
      pagina,
      porPagina,
    });

    const nombres = await this.resolverNombresInstructores(cursos.map(c => c.instructorId));
    const alumnos = await this.contarAlumnosPorCurso(cursos.map(c => c.id));

    return {
      cursos: cursos.map(c => this.mapearResumen(c, nombres.get(c.instructorId)!, alumnos.get(c.id) ?? 0)),
      total,
      page: pagina,
      totalPages: Math.max(1, Math.ceil(total / porPagina)),
    };
  }

  // Para el panel admin: a diferencia de findAll(), incluye borradores —
  // el listado público filtra soloPublicados:true, así que un curso sin
  // publicar nunca aparecía acá para poder publicarlo.
  @Get('admin/todos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listarTodosAdmin() {
    const cursos = await this.cursoRepository.findAll();
    const nombres = await this.resolverNombresInstructores(cursos.map(c => c.instructorId));
    const alumnos = await this.contarAlumnosPorCurso(cursos.map(c => c.id));
    return cursos.map(c => this.mapearResumen(c, nombres.get(c.instructorId)!, alumnos.get(c.id) ?? 0));
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  async findOne(@Param('id') id: string) {
    const curso = await this.cursoRepository.findById(id);
    if (!curso) {
      return { message: 'Curso no encontrado' };
    }
    return this.mapearDetalle(curso);
  }

  // "Recomendado para vos": mira las categorías de los cursos en los que
  // el estudiante ya está inscripto y sugiere otros cursos publicados de
  // esas mismas categorías que todavía no tiene. Sin ML, sin historial de
  // navegación — cross-sell simple basado en lo que ya demostró que le
  // interesa comprando. Antes de ":id" porque si no ":id" la captura
  // primero (mismo criterio que "me" en UsuarioController).
  @Get('recomendados/mios')
  @UseGuards(JwtAuthGuard)
  async recomendados(@Req() req: AuthenticatedRequest) {
    const inscripciones = await this.inscripcionRepository.findAllByEstudiante(req.user.id);
    if (inscripciones.length === 0) return [];

    const cursosInscriptos = await Promise.all(
      inscripciones.map((i) => this.cursoRepository.findById(i.cursoId)),
    );
    const ownedIds = new Set(inscripciones.map((i) => i.cursoId));
    const categorias = [...new Set(cursosInscriptos.filter((c): c is Curso => !!c?.categoria).map((c) => c!.categoria!))];
    if (categorias.length === 0) return [];

    const vistos = new Set(ownedIds);
    const recomendados: Curso[] = [];
    for (const categoria of categorias) {
      if (recomendados.length >= 4) break;
      const { cursos } = await this.cursoRepository.search({
        categoria,
        soloPublicados: true,
        ordenarPor: 'reciente',
        pagina: 1,
        porPagina: 6,
      });
      for (const c of cursos) {
        if (recomendados.length >= 4) break;
        if (vistos.has(c.id)) continue;
        vistos.add(c.id);
        recomendados.push(c);
      }
    }

    const nombres = await this.resolverNombresInstructores(recomendados.map((c) => c.instructorId));
    const alumnos = await this.contarAlumnosPorCurso(recomendados.map((c) => c.id));
    return recomendados.map((c) => this.mapearResumen(c, nombres.get(c.instructorId)!, alumnos.get(c.id) ?? 0));
  }

  // "Cursos relacionados" simple: misma categoría, publicados, excluyendo
  // el propio — sin ML ni historial de navegación, pero cubre el caso real
  // (alguien terminando de leer un curso de React quiere ver más de React).
  // Si el curso no tiene categoría cargada, no hay con qué relacionar —
  // devuelve vacío en vez de "cursos random" que rompen la premisa.
  @Get(':id/relacionados')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  async relacionados(@Param('id') id: string) {
    const curso = await this.cursoRepository.findById(id);
    if (!curso || !curso.categoria) return [];

    const { cursos } = await this.cursoRepository.search({
      categoria: curso.categoria,
      soloPublicados: true,
      ordenarPor: 'reciente',
      pagina: 1,
      porPagina: 5,
    });
    const relacionados = cursos.filter((c) => c.id !== id).slice(0, 4);

    const nombres = await this.resolverNombresInstructores(relacionados.map((c) => c.instructorId));
    const alumnos = await this.contarAlumnosPorCurso(relacionados.map((c) => c.id));
    return relacionados.map((c) => this.mapearResumen(c, nombres.get(c.instructorId)!, alumnos.get(c.id) ?? 0));
  }

  @Get('slug/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  async findBySlug(@Param('slug') slug: string) {
    const curso = await this.cursoRepository.findBySlug(slug);
    if (!curso) {
      return { message: 'Curso no encontrado' };
    }
    return this.mapearDetalle(curso);
  }

  private async mapearDetalle(curso: Curso) {
    const [instructor, inscripciones] = await Promise.all([
      this.usuarioRepository.findById(curso.instructorId),
      this.inscripcionRepository.findByCursoId(curso.id),
    ]);

    return {
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      slug: curso.slug.value,
      precio: curso.precio.value,
      estado: curso.estado.value,
      instructorId: curso.instructorId,
      instructorNombre: instructor?.nombre ?? 'Instructor',
      imagenUrl: curso.imagenUrl,
      categoria: curso.categoria,
      nivel: curso.nivel,
      objetivos: curso.objetivos,
      requisitos: curso.requisitos,
      audiencia: curso.audiencia,
      alumnosInscriptos: inscripciones.filter(i => i.activa).length,
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
          subtitulosUrl: l.subtitulosUrl,
          recursos: l.recursos,
          esVistaPrevia: l.esVistaPrevia,
          diasDesdeInscripcion: l.diasDesdeInscripcion,
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

  @Post('imagenes/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async subirImagen(@Body() body: { file: string; contentType: string }) {
    const buffer = Buffer.from(body.file, 'base64');
    const url = await this.subirImagenUC.execute(buffer, body.contentType);
    return { url };
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarCursoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const cursoPrevio = await this.cursoRepository.findById(id);
    await this.editarCursoUC.execute({
      cursoId: id,
      callerId: req.user.id,
      callerRol: req.user.rol,
      ...dto,
    });
    await this.invalidarCache(id, cursoPrevio?.slug.value);
    return { message: 'Curso actualizado correctamente' };
  }

  // PUT (no PATCH) a propósito: es la ruta que ya llama el botón
  // publicar/despublicar del panel de admin — antes no existía en el backend
  // y el botón siempre daba 404.
  @Put(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async cambiarEstado(
    @Param('id') id: string,
    @Body() dto: CambiarEstadoCursoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.cambiarEstadoCursoUC.execute({
      cursoId: id,
      callerId: req.user.id,
      callerRol: req.user.rol,
      estado: dto.estado,
    });
    await this.invalidarCache(id);
    return { message: 'Estado del curso actualizado correctamente' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const curso = await this.cursoRepository.findById(id);
    await this.eliminarCursoUC.execute({
      cursoId: id,
      callerId: req.user.id,
      callerRol: req.user.rol,
    });
    await this.invalidarCache(id, curso?.slug.value);
    return { message: 'Curso eliminado correctamente' };
  }
}
