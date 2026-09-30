import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../domain/usuario.repository.port';
import { IMAGE_STORAGE, ImageStorage } from '../../catalog/domain/image-storage.port';
import { detectarTipoImagen } from '../../catalog/domain/tipo-imagen';

@Injectable()
export class ActualizarAvatarUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @Inject(IMAGE_STORAGE)
    private readonly imageStorage: ImageStorage,
  ) {}

  /** `_contentTypeDeclarado` se ignora a propósito: el tipo se detecta de
   * los bytes reales (ver detectarTipoImagen). */
  async execute(usuarioId: string, file: Buffer, _contentTypeDeclarado?: string): Promise<string> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundDomainError('Usuario no encontrado');
    }
    const { contentType, extension } = detectarTipoImagen(file);
    // Nombre único por subida (no por usuario) — mismo criterio que las
    // portadas de curso: evita que el navegador siga sirviendo la versión
    // vieja desde caché con la misma URL.
    const key = `avatars/${usuarioId}-${randomUUID()}.${extension}`;
    const url = await this.imageStorage.upload(file, key, contentType);
    usuario.actualizarAvatar(url);
    await this.usuarioRepo.save(usuario);
    return url;
  }
}
