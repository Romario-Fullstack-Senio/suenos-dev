import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { ImageStorage } from '../../domain/image-storage.port';

@Injectable()
export class MinioImageStorageAdapter implements ImageStorage, OnModuleInit {
  private readonly logger = new Logger(MinioImageStorageAdapter.name);
  private readonly bucket = process.env.MINIO_BUCKET || 'suenos-dev';
  // MINIO_ENDPOINT es el host que la API usa para hablarle a MinIO (dentro de
  // Docker Compose es el nombre del servicio, ej. "minio"). MINIO_PUBLIC_URL
  // es el host desde el que el NAVEGADOR debe poder llegar a MinIO (ej.
  // "http://localhost:9000") — son distintos a propósito, no un duplicado.
  private readonly publicUrl = (process.env.MINIO_PUBLIC_URL || 'http://localhost:9000').replace(/\/$/, '');

  private readonly client = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket "${this.bucket}" creado en MinIO`);
      }

      // Lectura pública solo para el prefijo covers/ — no todo el bucket, así
      // si más adelante se guarda ahí algo menos público no queda expuesto
      // por accidente.
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/covers/*`],
          },
        ],
      };
      await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
      this.logger.log(`Política de lectura pública aplicada a "${this.bucket}/covers/*"`);
    } catch (error) {
      this.logger.error(`No se pudo inicializar el bucket de MinIO: ${error}`);
    }
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    await this.client.putObject(this.bucket, key, file, file.length, {
      'Content-Type': contentType,
    });
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }
}
