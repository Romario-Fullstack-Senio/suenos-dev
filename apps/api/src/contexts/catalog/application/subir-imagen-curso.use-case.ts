import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ImageStorage, IMAGE_STORAGE } from '../domain/image-storage.port';
import { detectarTipoImagen } from '../domain/tipo-imagen';

@Injectable()
export class SubirImagenCursoUseCase {
  constructor(
    @Inject(IMAGE_STORAGE)
    private readonly imageStorage: ImageStorage,
  ) {}

  /** `_contentTypeDeclarado` se ignora a propósito: el tipo se detecta de
   * los bytes reales (ver detectarTipoImagen). */
  async execute(file: Buffer, _contentTypeDeclarado?: string): Promise<string> {
    const { contentType, extension } = detectarTipoImagen(file);
    const key = `covers/${randomUUID()}.${extension}`;
    return this.imageStorage.upload(file, key, contentType);
  }
}
