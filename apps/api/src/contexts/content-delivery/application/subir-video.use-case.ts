import { Inject, Injectable } from '@nestjs/common';
import {
  VideoStorage,
  VIDEO_STORAGE,
} from '../domain/progreso-leccion.repository.port';

@Injectable()
export class SubirVideoUseCase {
  constructor(
    @Inject(VIDEO_STORAGE)
    private readonly videoStorage: VideoStorage,
  ) {}

  async execute(file: Buffer, leccionId: string): Promise<string> {
    const url = await this.videoStorage.upload(file, leccionId);
    return url;
  }
}
