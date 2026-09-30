import { DomainError } from '@suenos-dev/shared-kernel';

export interface TipoImagen {
  contentType: string;
  extension: string;
}

/**
 * Tipo real de una imagen según sus primeros bytes (firma del formato), no
 * según el contentType que declara el cliente. Antes se guardaba en MinIO el
 * contentType tal cual venía en el body, y covers/ y avatars/ son de lectura
 * pública: se podía subir un HTML declarándolo "text/html" y quedaba servido
 * como página desde el origen de MinIO.
 */
export function detectarTipoImagen(file: Buffer): TipoImagen {
  const empiezaCon = (...bytes: number[]) => bytes.every((b, i) => file[i] === b);

  if (empiezaCon(0xff, 0xd8, 0xff)) return { contentType: 'image/jpeg', extension: 'jpg' };
  if (empiezaCon(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { contentType: 'image/png', extension: 'png' };
  if (file.subarray(0, 6).toString('ascii') === 'GIF87a' || file.subarray(0, 6).toString('ascii') === 'GIF89a') {
    return { contentType: 'image/gif', extension: 'gif' };
  }
  if (file.subarray(0, 4).toString('ascii') === 'RIFF' && file.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { contentType: 'image/webp', extension: 'webp' };
  }

  throw new DomainError('El archivo no es una imagen válida (se aceptan JPG, PNG, WEBP o GIF)');
}
