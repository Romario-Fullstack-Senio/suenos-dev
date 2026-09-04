import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CrearPaqueteUseCase } from '../application/crear-paquete.use-case';
import { ActualizarPaqueteUseCase } from '../application/actualizar-paquete.use-case';
import { CambiarEstadoPaqueteUseCase } from '../application/cambiar-estado-paquete.use-case';
import { EliminarPaqueteUseCase } from '../application/eliminar-paquete.use-case';
import { Paquete } from '../domain/paquete.entity';
import { PAQUETE_REPOSITORY, PaqueteRepository } from '../domain/paquete.repository.port';
import { CURSO_REPOSITORY, CursoRepository } from '../../catalog/domain/curso.repository.port';
import { PaqueteDto } from './dto/paquete.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Inject } from '@nestjs/common';

function mapResumen(p: Paquete) {
  return {
    id: p.id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    cursoIds: p.cursoIds,
    descuentoPorcentaje: p.descuentoPorcentaje,
    activo: p.activo,
    createdAt: p.createdAt,
  };
}

@Controller('paquetes')
export class PaqueteController {
  constructor(
    @Inject(PAQUETE_REPOSITORY)
    private readonly paqueteRepo: PaqueteRepository,
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    private readonly crearPaqueteUC: CrearPaqueteUseCase,
    private readonly actualizarPaqueteUC: ActualizarPaqueteUseCase,
    private readonly cambiarEstadoPaqueteUC: CambiarEstadoPaqueteUseCase,
    private readonly eliminarPaqueteUC: EliminarPaqueteUseCase,
  ) {}

  @Get()
  async listar() {
    const paquetes = await this.paqueteRepo.findAll(true);
    return Promise.all(paquetes.map((p) => this.mapConPrecios(p)));
  }

  @Get('admin/todos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listarTodos() {
    const paquetes = await this.paqueteRepo.findAll(false);
    return Promise.all(paquetes.map((p) => this.mapConPrecios(p)));
  }

  @Get(':id')
  async obtener(@Param('id') id: string) {
    const paquete = await this.paqueteRepo.findById(id);
    if (!paquete) return { message: 'Paquete no encontrado' };
    return this.mapConPrecios(paquete);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async crear(@Body() dto: PaqueteDto) {
    const paquete = await this.crearPaqueteUC.execute({ ...dto, descripcion: dto.descripcion ?? '' });
    return mapResumen(paquete);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async actualizar(@Param('id') id: string, @Body() dto: PaqueteDto) {
    await this.actualizarPaqueteUC.execute({ paqueteId: id, ...dto, descripcion: dto.descripcion ?? '' });
    return { message: 'Paquete actualizado' };
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async cambiarEstado(@Param('id') id: string, @Body('activo') activo: boolean) {
    await this.cambiarEstadoPaqueteUC.execute(id, activo);
    return { message: 'Estado actualizado' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string) {
    await this.eliminarPaqueteUC.execute(id);
    return { message: 'Paquete eliminado' };
  }

  // Resuelve título/precio/imagen reales de cada curso incluido — nunca se
  // guardan copiados en el paquete, así que si el precio de un curso
  // cambia el paquete siempre refleja el precio actual.
  private async mapConPrecios(paquete: Paquete) {
    const cursos = await Promise.all(paquete.cursoIds.map((id) => this.cursoRepository.findById(id)));
    const cursosValidos = cursos.filter((c): c is NonNullable<typeof c> => !!c);
    const precioTotal = cursosValidos.reduce((sum, c) => sum + c.precio.value, 0);
    const precioFinal = Math.round(precioTotal * (1 - paquete.descuentoPorcentaje / 100) * 100) / 100;

    return {
      ...mapResumen(paquete),
      cursos: cursosValidos.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        precio: c.precio.value,
        imagenUrl: c.imagenUrl,
        slug: c.slug.value,
      })),
      precioTotal,
      precioFinal,
    };
  }
}
