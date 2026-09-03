export const IMAGE_STORAGE = 'IMAGE_STORAGE';

/**
 * Puerto de dominio para almacenamiento de imágenes (portadas de curso).
 * A diferencia de VideoStorage (content-delivery), este sí lo implementa
 * un adapter que usa MinIO de verdad — ver MinioImageStorageAdapter.
 */
export interface ImageStorage {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
}
