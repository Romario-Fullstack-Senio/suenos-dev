import { Certificado } from './certificado.entity';

export const PDF_GENERATOR = 'PDF_GENERATOR';

export interface PdfGenerator {
  generate(certificado: Certificado): Promise<Buffer>;
}
