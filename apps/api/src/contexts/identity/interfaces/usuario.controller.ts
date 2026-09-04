import { Controller, Get, Put, Param, Body, Req, Inject, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../domain/usuario.repository.port';
import { ActualizarPerfilUseCase } from '../application/actualizar-perfil.use-case';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

const TODOS_LOS_ROLES = ['estudiante', 'instructor', 'admin'];

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsuarioController {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    private readonly actualizarPerfilUC: ActualizarPerfilUseCase,
  ) {}

  // Rutas "me" ANTES de ":id" — si no, ":id" las captura primero y "me" se
  // trata como si fuera un id. @Roles a nivel de método pisa el
  // @Roles('admin') de la clase (RolesGuard usa getAllAndOverride):
  // cualquier usuario logueado puede ver/editar su propio perfil, no hace
  // falta ser admin.

  @Get('me')
  @Roles(...TODOS_LOS_ROLES)
  async me(@Req() req: AuthenticatedRequest) {
    const usuario = await this.usuarioRepository.findById(req.user.id);
    if (!usuario) {
      return { message: 'Usuario no encontrado' };
    }
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email.value,
      rol: usuario.rol.value,
      emailVerificado: usuario.emailVerificado,
    };
  }

  @Put('me')
  @Roles(...TODOS_LOS_ROLES)
  async actualizarMe(@Body() dto: ActualizarPerfilDto, @Req() req: AuthenticatedRequest) {
    await this.actualizarPerfilUC.execute({ usuarioId: req.user.id, nombre: dto.nombre, email: dto.email });
    return { message: 'Perfil actualizado correctamente' };
  }

  @Get()
  async findAll() {
    const usuarios = await this.usuarioRepository.findAll();
    return usuarios.map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email.value,
      rol: u.rol.value,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      return { message: 'Usuario no encontrado' };
    }
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email.value,
      rol: usuario.rol.value,
    };
  }

  @Put(':id/rol')
  async updateRol(@Param('id') id: string, @Body() body: { rol: string }) {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      return { message: 'Usuario no encontrado' };
    }
    usuario.cambiarRol(body.rol as any);
    await this.usuarioRepository.save(usuario);
    return { message: 'Rol actualizado correctamente' };
  }
}
