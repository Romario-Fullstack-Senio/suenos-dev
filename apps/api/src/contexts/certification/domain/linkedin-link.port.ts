import { Certificado } from './certificado.entity';

export const LINKEDIN_LINK = 'LINKEDIN_LINK';

export interface LinkedInLink {
  generate(certificado: Certificado): string;
}
