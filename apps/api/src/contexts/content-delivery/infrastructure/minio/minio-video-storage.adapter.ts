import { Injectable, Logger } from '@nestjs/common';
import { VideoStorage } from '../../domain/progreso-leccion.repository.port';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class MinioVideoStorageAdapter implements VideoStorage {
  private readonly logger = new Logger(MinioVideoStorageAdapter.name);
  private readonly tempDir = path.join(process.cwd(), 'temp-videos');
  private readonly outputDir = path.join(process.cwd(), 'temp-videos', 'hls');

  constructor() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async upload(file: Buffer, key: string): Promise<string> {
    const videoId = randomUUID();
    const inputPath = path.join(this.tempDir, `${videoId}.mp4`);
    const outputDir = path.join(this.outputDir, videoId);

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(inputPath, file);

    this.logger.log(`Transcoding video ${key} to HLS...`);

    try {
      await execAsync(
        `ffmpeg -i "${inputPath}" -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputDir}/segment_%03d.ts" -hls_segment_type mpegts "${outputDir}/playlist.m3u8"`,
        { timeout: 300000 },
      );

      this.logger.log(`Video transcoded successfully: ${videoId}`);

      this.cleanupTempFile(inputPath);

      return this.getHlsPlaylistUrl(videoId);
    } catch (error) {
      this.logger.error(`Transcoding failed: ${error}`);
      this.cleanupTempFile(inputPath);
      throw new Error('Video transcoding failed');
    }
  }

  async getStreamUrl(key: string): Promise<string> {
    const playlistPath = path.join(this.outputDir, key, 'playlist.m3u8');
    if (fs.existsSync(playlistPath)) {
      return this.getHlsPlaylistUrl(key);
    }
    return `http://localhost:9000/videos/${key}`;
  }

  private getHlsPlaylistUrl(videoId: string): string {
    return `http://localhost:9000/hls/${videoId}/playlist.m3u8`;
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
}
