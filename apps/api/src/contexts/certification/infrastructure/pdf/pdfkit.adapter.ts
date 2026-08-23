import { Injectable } from '@nestjs/common';
import { Certificado } from '../../domain/certificado.entity';
import { PdfGenerator } from '../../domain/pdf-generator.port';

@Injectable()
export class PdfKitAdapter implements PdfGenerator {
  async generate(certificado: Certificado): Promise<Buffer> {
    const content = [
      `CERTIFICADO DE COMPLETACIÓN`,
      ``,
      `Estudiante: ${certificado.estudianteNombre}`,
      `Curso: ${certificado.cursoNombre}`,
      `Fecha de Emisión: ${certificado.fechaEmision.toISOString()}`,
      `Código de Verificación: ${certificado.codigoVerificacion}`,
      ``,
      `URL de Verificación: ${certificado.getVerifyUrl()}`,
    ].join('\n');

    return Buffer.from(content, 'utf-8');
  }
}
