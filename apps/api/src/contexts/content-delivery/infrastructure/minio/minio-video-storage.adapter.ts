import { Injectable } from '@nestjs/common';
import { VideoStorage } from '../../domain/progreso-leccion.repository.port';

@Injectable()
export class MinioVideoStorageAdapter implements VideoStorage {
  async upload(file: Buffer, key: string): Promise<string> {
    // TODO: Implementar integración real con MinIO
    // TODO: Generar nombre único para el archivo
    // TODO: Subir archivo al bucket de videos
    // TODO: Retornar URL pública del archivo
    console.log('Video subido (simulado):', key);
    return `http://localhost:9000/videos/${key}`;
  }

  async getStreamUrl(key: string): Promise<string> {
    // TODO: Implementar generación de URL con expiración
    return `http://localhost:9000/videos/${key}`;
  }
}
