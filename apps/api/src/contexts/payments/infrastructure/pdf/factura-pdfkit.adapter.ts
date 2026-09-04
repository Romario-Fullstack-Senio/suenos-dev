import { Injectable } from '@nestjs/common';
import { FacturaData, FacturaGenerator } from '../../domain/factura-generator.port';
import PDFDocument from 'pdfkit';

@Injectable()
export class FacturaPdfKitAdapter implements FacturaGenerator {
  async generate(data: FacturaData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 } });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;

      doc.fontSize(22).fillColor('#1e293b').font('Helvetica-Bold').text('Sueños Dev', 60, 60);
      doc.fontSize(10).fillColor('#64748b').font('Helvetica').text('Plataforma de E-Learning', 60, 88);

      doc.fontSize(16).fillColor('#1e293b').font('Helvetica-Bold').text('Comprobante de compra', 60, 130);

      const fecha = data.fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.fontSize(10).fillColor('#64748b').font('Helvetica');
      doc.text(`N° de comprobante: ${data.numeroComprobante}`, 60, 160);
      doc.text(`Fecha: ${fecha}`, 60, 176);
      doc.text(`Estado: ${data.estado}`, 60, 192);

      doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text('Comprador', 60, 230);
      doc.fontSize(10).fillColor('#334155').font('Helvetica');
      doc.text(data.compradorNombre, 60, 248);
      doc.text(data.compradorEmail, 60, 264);

      // Tabla: una fila por curso — antes era siempre un único ítem, ahora
      // una orden puede venir de un carrito con varios cursos a la vez.
      const tableY = 310;
      const rowH = 28;
      doc.rect(60, tableY, pageW - 120, rowH).fill('#f8fafc');
      doc.fontSize(10).fillColor('#475569').font('Helvetica-Bold');
      doc.text('Descripción', 72, tableY + 9);
      doc.text('Monto', pageW - 160, tableY + 9, { width: 88, align: 'right' });

      let y = tableY + rowH + 10;
      doc.fontSize(10).fillColor('#1e293b').font('Helvetica');
      for (const item of data.items) {
        doc.text(item.nombre, 72, y, { width: pageW - 260 });
        doc.text(`$${item.precio.toFixed(2)} ${data.moneda.toUpperCase()}`, pageW - 160, y, {
          width: 88,
          align: 'right',
        });
        y += 20;
      }

      const lineY = y + 12;
      doc.moveTo(60, lineY).lineTo(pageW - 60, lineY).lineWidth(1).stroke('#e2e8f0');

      doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text('Total', pageW - 260, lineY + 12, { width: 100 });
      doc.text(`$${data.monto.toFixed(2)} ${data.moneda.toUpperCase()}`, pageW - 160, lineY + 12, {
        width: 88,
        align: 'right',
      });

      doc.fontSize(9).fillColor('#94a3b8').font('Helvetica').text(
        'Este comprobante es válido como constancia de compra. Ante cualquier consulta, contactá a soporte.',
        60,
        doc.page.height - 100,
        { width: pageW - 120, align: 'center' },
      );

      doc.end();
    });
  }
}
