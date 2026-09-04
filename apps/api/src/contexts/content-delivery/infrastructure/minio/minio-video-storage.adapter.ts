import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { VideoStorage, VideoObjectStream } from '../../domain/progreso-leccion.repository.port';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class MinioVideoStorageAdapter implements VideoStorage {
  private readonly logger = new Logger(MinioVideoStorageAdapter.name);
  private readonly bucket = process.env.MINIO_BUCKET || 'suenos-dev';
  private readonly tempDir = path.join(process.cwd(), 'temp-videos');
  // FFMPEG_PATH es un override para dev en Windows donde el binario instalado
  // por winget no siempre queda en el PATH del proceso de Node hasta reiniciar
  // la sesión. En producción/CI, con ffmpeg instalado en el PATH normal, esta
  // variable no hace falta.
  private readonly ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg';

  private readonly client = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });

  constructor() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /** `key` es la leccionId (viene de SubirVideoUseCase) — a diferencia de la
   * versión anterior, que descartaba ese id y generaba uno random propio,
   * ahora es también el identificador con el que se guarda en MinIO y se
   * sirve después. Sin ese enlace, VideoController no podría saber a qué
   * lección/curso pertenece un video para aplicar control de acceso. */
  async upload(file: Buffer, key: string): Promise<string> {
    const inputPath = path.join(this.tempDir, `${key}.mp4`);
    const outputDir = path.join(this.tempDir, 'hls', key);

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(inputPath, file);

    this.logger.log(`Transcodificando video de la lección ${key} a HLS...`);

    try {
      await execAsync(
        `"${this.ffmpegBin}" -i "${inputPath}" -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputDir}/segment_%03d.ts" -hls_segment_type mpegts "${outputDir}/playlist.m3u8"`,
        { timeout: 300000 },
      );

      this.logger.log(`Video transcodificado, subiendo a MinIO (bucket privado): ${key}`);
      await this.subirDirectorioAMinio(outputDir, key);

      this.cleanupPath(inputPath);
      this.cleanupPath(outputDir);

      return this.getHlsPlaylistUrl(key);
    } catch (error) {
      this.logger.error(`Falló la transcodificación/subida: ${error}`);
      this.cleanupPath(inputPath);
      this.cleanupPath(outputDir);
      throw new Error('Video transcoding failed');
    }
  }

  async getStreamUrl(key: string): Promise<string> {
    const exists = await this.existeEnMinio(key, 'playlist.m3u8');
    if (!exists) {
      throw new Error(`No se encontró un video transcodificado para la clave: ${key}`);
    }
    return this.getHlsPlaylistUrl(key);
  }

  async getObject(key: string, filename: string): Promise<VideoObjectStream | null> {
    const objectKey = `videos/${key}/${filename}`;
    try {
      const stream = await this.client.getObject(this.bucket, objectKey);
      const ext = path.extname(filename);
      const contentType = ext === '.m3u8' ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
      return { stream, contentType };
    } catch {
      return null;
    }
  }

  private static readonly CONTENT_TYPES: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };

  /** `key` es la leccionId — mismo bucket privado que el video/subtítulos,
   * ruta separada (`recursos/{key}/{filename}`) para que una lección pueda
   * tener varios recursos sin pisarse entre sí. */
  async uploadRecurso(file: Buffer, key: string, filename: string): Promise<string> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
    const contentType = MinioVideoStorageAdapter.CONTENT_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream';
    await this.client.putObject(this.bucket, `recursos/${key}/${filename}`, file, file.length, {
      'Content-Type': contentType,
    });
    const apiUrl = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${apiUrl}/api/videos/recursos/${key}/${encodeURIComponent(filename)}`;
  }

  async getRecurso(key: string, filename: string): Promise<VideoObjectStream | null> {
    try {
      const stream = await this.client.getObject(this.bucket, `recursos/${key}/${filename}`);
      const contentType = MinioVideoStorageAdapter.CONTENT_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream';
      return { stream, contentType };
    } catch {
      return null;
    }
  }

  async deleteRecurso(key: string, filename: string): Promise<void> {
    await this.client.removeObject(this.bucket, `recursos/${key}/${filename}`);
  }

  /** `key` es la leccionId, igual que el video — mismo bucket privado, ruta
   * separada (`subtitulos/{key}.vtt`) para no pisar los segmentos HLS. */
  async uploadSubtitulos(file: Buffer, key: string): Promise<string> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
    await this.client.putObject(this.bucket, `subtitulos/${key}.vtt`, file, file.length, {
      'Content-Type': 'text/vtt',
    });
    const apiUrl = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${apiUrl}/api/videos/subtitulos/${key}`;
  }

  async getSubtitulos(key: string): Promise<VideoObjectStream | null> {
    try {
      const stream = await this.client.getObject(this.bucket, `subtitulos/${key}.vtt`);
      return { stream, contentType: 'text/vtt' };
    } catch {
      return null;
    }
  }

  private async existeEnMinio(key: string, filename: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, `videos/${key}/${filename}`);
      return true;
    } catch {
      return false;
    }
  }

  private async subirDirectorioAMinio(dir: string, key: string): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
    const archivos = fs.readdirSync(dir);
    for (const archivo of archivos) {
      const filePath = path.join(dir, archivo);
      const objectKey = `videos/${key}/${archivo}`;
      await this.client.fPutObject(this.bucket, objectKey, filePath);
    }
  }

  private getHlsPlaylistUrl(leccionId: string): string {
    // Ruta servida por VideoController#serveHls (puerto de la API), que
    // valida acceso (vista previa gratuita o inscripción) y hace de proxy
    // hacia MinIO — el bucket de videos es privado, no se expone la URL de
    // MinIO directamente como sí pasa con las portadas de curso.
    const apiUrl = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${apiUrl}/api/videos/hls/${leccionId}/playlist.m3u8`;
  }

  private cleanupPath(target: string): void {
    try {
      if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true });
      }
    } catch {
      // Best-effort cleanup — si falla, el archivo temporal queda huérfano
      // en disco pero no rompe el flujo de subida (que ya terminó bien).
    }
  }
}
