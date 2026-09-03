import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ImageStorage, IMAGE_STORAGE } from '../domain/image-storage.port';

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class SubirImagenCursoUseCase {
  constructor(
    @Inject(IMAGE_STORAGE)
    private readonly imageStorage: ImageStorage,
  ) {}

  async execute(file: Buffer, contentType: string): Promise<string> {
    const ext = EXTENSION_BY_CONTENT_TYPE[contentType] || 'jpg';
    const key = `covers/${randomUUID()}.${ext}`;
    return this.imageStorage.upload(file, key, contentType);
  }
}
