import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotFoundDomainError } from '@suenos-dev/shared-kernel';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../domain/usuario.repository.port';
import { IMAGE_STORAGE, ImageStorage } from '../../catalog/domain/image-storage.port';

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class ActualizarAvatarUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: UsuarioRepository,
    @Inject(IMAGE_STORAGE)
    private readonly imageStorage: ImageStorage,
  ) {}

  async execute(usuarioId: string, file: Buffer, contentType: string): Promise<string> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundDomainError('Usuario no encontrado');
    }
    const ext = EXTENSION_BY_CONTENT_TYPE[contentType] || 'jpg';
    // Nombre único por subida (no por usuario) — mismo criterio que las
    // portadas de curso: evita que el navegador siga sirviendo la versión
    // vieja desde caché con la misma URL.
    const key = `avatars/${usuarioId}-${randomUUID()}.${ext}`;
    const url = await this.imageStorage.upload(file, key, contentType);
    usuario.actualizarAvatar(url);
    await this.usuarioRepo.save(usuario);
    return url;
  }
}
