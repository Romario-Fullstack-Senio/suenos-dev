import { Injectable } from '@nestjs/common';
import { Certificado } from '../../domain/certificado.entity';
import { PdfGenerator } from '../../domain/pdf-generator.port';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

// Paleta alineada a las custom properties de la web (--suenos-*, ver
// globals.css/tailwind.config.ts) — índigo como color de marca, dorado
// como acento. Sobre fondo blanco (no el midnight oscuro de la web) porque
// esto es un documento pensado para imprimirse.
const INDIGO = '#312e81';
const INDIGO_LIGHT = '#4f46e5';
const GOLD = '#b45309';
const GOLD_LIGHT = '#d97706';
const INK = '#1f2937';
const INK_MUTED = '#6b7280';

@Injectable()
export class PdfKitAdapter implements PdfGenerator {
  async generate(certificado: Certificado): Promise<Buffer> {
    // El QR se genera antes de abrir el documento — pdfkit necesita el
    // buffer de la imagen ya resuelto para poder insertarlo con doc.image().
    const qrBuffer = await QRCode.toBuffer(certificado.getVerifyUrl(), {
      margin: 0,
      color: { dark: INDIGO, light: '#00000000' },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const centerX = pageW / 2;

      // ---- Fondo y marco ------------------------------------------------
      doc.rect(0, 0, pageW, pageH).fill('#fdfcf9');
      doc.rect(0, 0, pageW, 8).fill(INDIGO);

      // Marco doble: línea gruesa índigo por fuera, fina dorada por dentro.
      doc.rect(24, 24, pageW - 48, pageH - 48).lineWidth(2.5).stroke(INDIGO);
      doc.rect(34, 34, pageW - 68, pageH - 68).lineWidth(1).stroke(GOLD);

      // Escuadras decorativas en las cuatro esquinas del marco interior.
      const cornerLen = 26;
      const corners: [number, number, number, number][] = [
        [34, 34, 1, 1],
        [pageW - 34, 34, -1, 1],
        [34, pageH - 34, 1, -1],
        [pageW - 34, pageH - 34, -1, -1],
      ];
      for (const [x, y, dx, dy] of corners) {
        doc
          .moveTo(x, y + dy * cornerLen)
          .lineTo(x, y)
          .lineTo(x + dx * cornerLen, y)
          .lineWidth(2.5)
          .stroke(GOLD);
      }

      // ---- Encabezado -----------------------------------------------------
      doc
        .fontSize(13)
        .fillColor(INDIGO)
        .font('Helvetica-Bold')
        .text('SUEÑOS DEV', 0, 58, { align: 'center', characterSpacing: 3 });
      doc
        .fontSize(8)
        .fillColor(INK_MUTED)
        .font('Helvetica')
        .text('PLATAFORMA DE E-LEARNING', 0, 76, { align: 'center', characterSpacing: 2 });

      // ---- Título -----------------------------------------------------
      doc
        .fontSize(36)
        .fillColor(INDIGO)
        .font('Helvetica-Bold')
        .text('CERTIFICADO', 0, 103, { align: 'center', characterSpacing: 1 });
      doc
        .fontSize(14)
        .fillColor(GOLD_LIGHT)
        .font('Helvetica')
        .text('DE FINALIZACIÓN', 0, 145, { align: 'center', characterSpacing: 6 });

      // Diamante decorativo centrado bajo el subtítulo.
      const diamondY = 172;
      doc.moveTo(centerX - 90, diamondY).lineTo(centerX - 8, diamondY).lineWidth(1).stroke(GOLD);
      doc
        .polygon([centerX, diamondY - 4], [centerX + 4, diamondY], [centerX, diamondY + 4], [centerX - 4, diamondY])
        .fill(GOLD);
      doc.moveTo(centerX + 8, diamondY).lineTo(centerX + 90, diamondY).lineWidth(1).stroke(GOLD);

      // ---- Cuerpo -----------------------------------------------------
      doc
        .fontSize(13)
        .fillColor(INK_MUTED)
        .font('Helvetica')
        .text('Se certifica que', 0, 196, { align: 'center' });

      doc
        .fontSize(28)
        .fillColor(INK)
        .font('Helvetica-Bold')
        .text(certificado.estudianteNombre, 80, 218, { align: 'center', width: pageW - 160 });

      // widthOfString usa la fuente/tamaño activos en el doc — ya quedaron
      // seteados en Helvetica-Bold/28 por el .text() de arriba.
      const nombreWidth = Math.min(doc.widthOfString(certificado.estudianteNombre) + 20, pageW - 200);
      doc
        .moveTo(centerX - nombreWidth / 2, 254)
        .lineTo(centerX + nombreWidth / 2, 254)
        .lineWidth(1)
        .stroke('#d1d5db');

      doc
        .fontSize(13)
        .fillColor(INK_MUTED)
        .font('Helvetica')
        .text('ha completado satisfactoriamente el curso', 0, 268, { align: 'center' });

      doc
        .fontSize(20)
        .fillColor(INDIGO_LIGHT)
        .font('Helvetica-Bold')
        .text(certificado.cursoNombre, 80, 292, { align: 'center', width: pageW - 160 });

      // ---- Sello circular (badge), centrado entre el cuerpo y el pie --
      const sealX = centerX;
      const sealY = 375;
      const sealR = 24;
      doc.circle(sealX, sealY, sealR).fill(GOLD);
      doc.circle(sealX, sealY, sealR - 4).lineWidth(1).stroke('#fdfcf9');
      doc
        .moveTo(sealX - 9, sealY)
        .lineTo(sealX - 2, sealY + 7)
        .lineTo(sealX + 10, sealY - 9)
        .lineWidth(2.5)
        .stroke('#fdfcf9');
      doc
        .polygon([sealX - 11, sealY + sealR - 5], [sealX - 2, sealY + sealR - 5], [sealX - 6, sealY + sealR + 12])
        .fill(GOLD_LIGHT);
      doc
        .polygon([sealX + 2, sealY + sealR - 5], [sealX + 11, sealY + sealR - 5], [sealX + 6, sealY + sealR + 12])
        .fill(GOLD_LIGHT);

      // ---- Pie: fecha/código (izq.) · firma (centro-der.) · QR (der.) -
      const footerY = pageH - 92;

      const fecha = certificado.fechaEmision.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.fontSize(8).fillColor(INK_MUTED).font('Helvetica-Bold').text('FECHA DE EMISIÓN', 64, footerY, { width: 230 });
      doc.fontSize(10.5).fillColor(INK).font('Helvetica').text(fecha, 64, footerY + 12, { width: 230 });

      doc.fontSize(8).fillColor(INK_MUTED).font('Helvetica-Bold').text('CÓDIGO DE VERIFICACIÓN', 64, footerY + 34, { width: 260 });
      doc.fontSize(9.5).fillColor(INK).font('Helvetica').text(certificado.codigoVerificacion, 64, footerY + 46, { width: 260 });

      // Firma institucional (Sueños Dev) — sin nombre de persona.
      const firmaX = pageW - 300;
      const firmaW = 150;
      doc.moveTo(firmaX, footerY + 8).lineTo(firmaX + firmaW, footerY + 8).lineWidth(1).stroke('#9ca3af');
      doc.fontSize(11).fillColor(INDIGO).font('Helvetica-Bold').text('Sueños Dev', firmaX, footerY + 14, { width: firmaW, align: 'center' });
      doc.fontSize(8).fillColor(INK_MUTED).font('Helvetica').text('Plataforma de E-Learning', firmaX, footerY + 29, { width: firmaW, align: 'center' });

      // QR de verificación, a la derecha de la firma (sin superponerse).
      const qrSize = 52;
      const qrX = pageW - 64 - qrSize;
      const qrY = footerY - 4;
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
      doc
        .fontSize(6)
        .fillColor(INK_MUTED)
        .font('Helvetica')
        .text('Escaneá para verificar', qrX - 24, qrY + qrSize + 3, { width: qrSize + 48, align: 'center' });

      doc.end();
    });
  }
}
