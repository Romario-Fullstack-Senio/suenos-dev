import { Controller, Get, Put, Param, Body, Inject, UseGuards } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../domain/usuario.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsuarioController {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

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
