import { Injectable } from '@nestjs/common';
import { Certificado } from '../../domain/certificado.entity';
import { PdfGenerator } from '../../domain/pdf-generator.port';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfKitAdapter implements PdfGenerator {
  async generate(certificado: Certificado): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const centerX = pageW / 2;

      // Border
      doc.rect(20, 20, pageW - 40, pageH - 40).lineWidth(3).stroke('#1a365d');
      doc.rect(30, 30, pageW - 60, pageH - 60).lineWidth(1).stroke('#c9a96e');

      // Header
      doc.fontSize(14).fillColor('#666').font('Helvetica').text('SUENOS DEV', centerX, 60, { align: 'center' });
      doc.moveDown(0.5);

      // Title
      doc.fontSize(36).fillColor('#1a365d').font('Helvetica-Bold').text('CERTIFICADO', centerX - 200, 100, {
        align: 'center',
        width: 400,
      });
      doc.fontSize(18).fillColor('#666').font('Helvetica').text('DE COMPLETACION', centerX - 200, 145, {
        align: 'center',
        width: 400,
      });

      // Decorative line
      doc.moveTo(centerX - 100, 185).lineTo(centerX + 100, 185).lineWidth(2).stroke('#c9a96e');

      // Body text
      doc.moveDown(3);
      doc.fontSize(14).fillColor('#333').font('Helvetica').text('Se certifica que', { align: 'center' });

      doc.moveDown(1);
      doc.fontSize(28).fillColor('#1a365d').font('Helvetica-Bold').text(certificado.estudianteNombre, { align: 'center' });

      doc.moveDown(1);
      doc.fontSize(14).fillColor('#333').font('Helvetica').text('ha completado satisfactoriamente el curso', { align: 'center' });

      doc.moveDown(1);
      doc.fontSize(22).fillColor('#1a365d').font('Helvetica-Bold').text(certificado.cursoNombre, {
        align: 'center',
        width: 500,
      });

      // Footer info
      const footerY = pageH - 140;

      doc.fontSize(10).fillColor('#666').font('Helvetica');

      const fecha = certificado.fechaEmision.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(`Fecha de emision: ${fecha}`, 60, footerY, { width: 200 });

      doc.text(`Codigo de verificacion: ${certificado.codigoVerificacion}`, 60, footerY + 20, { width: 300 });

      // Verification URL
      doc.fontSize(9).fillColor('#999').text(
        `Verificar en: ${certificado.getVerifyUrl()}`,
        centerX - 150,
        footerY + 50,
        { width: 300, align: 'center' },
      );

      // Signature line
      doc.moveTo(pageW - 250, footerY).lineTo(pageW - 60, footerY).lineWidth(1).stroke('#999');
      doc.fontSize(10).fillColor('#666').text('Director Academico', pageW - 250, footerY + 5, { width: 190, align: 'center' });

      doc.end();
    });
  }
}
