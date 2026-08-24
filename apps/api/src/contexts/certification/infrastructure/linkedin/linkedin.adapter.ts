import { Injectable } from '@nestjs/common';
import { Certificado } from '../../domain/certificado.entity';
import { LinkedInLink } from '../../domain/linkedin-link.port';

@Injectable()
export class LinkedInAdapter implements LinkedInLink {
  generate(certificado: Certificado): string {
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION',
      name: certificado.cursoNombre,
      organizationName: 'Suenos Dev',
      issueYear: certificado.fechaEmision.getFullYear().toString(),
      issueMonth: (certificado.fechaEmision.getMonth() + 1).toString(),
      certUrl: certificado.getVerifyUrl(),
      certId: certificado.codigoVerificacion,
    });

    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  }

  generateShareLink(certificado: Certificado): string {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificado.getVerifyUrl())}`;
  }
}
