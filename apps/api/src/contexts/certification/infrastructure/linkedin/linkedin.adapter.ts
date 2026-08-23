import { Injectable } from '@nestjs/common';
import { Certificado } from '../../domain/certificado.entity';
import { LinkedInLink } from '../../domain/linkedin-link.port';

@Injectable()
export class LinkedInAdapter implements LinkedInLink {
  generate(certificado: Certificado): string {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificado.getVerifyUrl())}`;
  }
}
