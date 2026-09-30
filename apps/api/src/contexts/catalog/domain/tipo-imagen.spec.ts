import { detectarTipoImagen } from './tipo-imagen';

describe('detectarTipoImagen', () => {
  it('detecta PNG por su firma, ignorando lo que declare el cliente', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(detectarTipoImagen(png)).toEqual({ contentType: 'image/png', extension: 'png' });
  });

  it('detecta JPEG y WEBP', () => {
    expect(detectarTipoImagen(Buffer.from([0xff, 0xd8, 0xff, 0xe0])).contentType).toBe('image/jpeg');
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
    expect(detectarTipoImagen(webp).contentType).toBe('image/webp');
  });

  // Regresión: antes se guardaba en MinIO (covers/ y avatars/ son públicos)
  // el contentType que mandaba el cliente, y un HTML subido como portada
  // quedaba servido como página.
  it('rechaza HTML y SVG aunque vengan como "imagen"', () => {
    expect(() => detectarTipoImagen(Buffer.from('<html><script>alert(1)</script></html>'))).toThrow(
      'El archivo no es una imagen válida',
    );
    expect(() => detectarTipoImagen(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toThrow();
  });
});
