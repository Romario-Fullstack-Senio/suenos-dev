import { Controller, Get, Put, Delete, Param, Body, Req, Inject, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../domain/usuario.repository.port';
import { ActualizarPerfilUseCase } from '../application/actualizar-perfil.use-case';
import { ActualizarAvatarUseCase } from '../application/actualizar-avatar.use-case';
import { EliminarCuentaUseCase } from '../application/eliminar-cuenta.use-case';
import { ActualizarPreferenciaNotificacionUseCase } from '../application/actualizar-preferencia-notificacion.use-case';
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
    private readonly actualizarAvatarUC: ActualizarAvatarUseCase,
    private readonly eliminarCuentaUC: EliminarCuentaUseCase,
    private readonly actualizarPreferenciaNotificacionUC: ActualizarPreferenciaNotificacionUseCase,
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
      avatarUrl: usuario.avatarUrl,
      notificarCursoNuevo: usuario.notificarCursoNuevo,
    };
  }

  @Put('me')
  @Roles(...TODOS_LOS_ROLES)
  async actualizarMe(@Body() dto: ActualizarPerfilDto, @Req() req: AuthenticatedRequest) {
    await this.actualizarPerfilUC.execute({ usuarioId: req.user.id, nombre: dto.nombre, email: dto.email });
    // Devolvemos el estado real post-guardado (no lo que mandó el cliente)
    // — si cambió el email, emailVerificado ahora es false, y el frontend
    // necesita saberlo para volver a mostrar el banner de "verificá tu
    // email" sin esperar a un refresh de página.
    const actualizado = await this.usuarioRepository.findById(req.user.id);
    return {
      message: 'Perfil actualizado correctamente',
      usuario: actualizado && {
        id: actualizado.id,
        nombre: actualizado.nombre,
        email: actualizado.email.value,
        rol: actualizado.rol.value,
        emailVerificado: actualizado.emailVerificado,
        avatarUrl: actualizado.avatarUrl,
      },
    };
  }

  @Put('me/avatar')
  @Roles(...TODOS_LOS_ROLES)
  async actualizarAvatar(@Body() body: { file: string; contentType: string }, @Req() req: AuthenticatedRequest) {
    const buffer = Buffer.from(body.file, 'base64');
    const url = await this.actualizarAvatarUC.execute(req.user.id, buffer, body.contentType);
    return { avatarUrl: url };
  }

  @Delete('me')
  @Roles(...TODOS_LOS_ROLES)
  @HttpCode(HttpStatus.OK)
  async eliminarCuenta(@Body('password') password: string | undefined, @Req() req: AuthenticatedRequest) {
    await this.eliminarCuentaUC.execute(req.user.id, password);
    return { message: 'Cuenta eliminada correctamente' };
  }

  @Put('me/preferencias-notificacion')
  @Roles(...TODOS_LOS_ROLES)
  async actualizarPreferenciaNotificacion(
    @Body('notificarCursoNuevo') notificarCursoNuevo: boolean,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.actualizarPreferenciaNotificacionUC.execute(req.user.id, notificarCursoNuevo);
    return { message: 'Preferencia actualizada' };
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
