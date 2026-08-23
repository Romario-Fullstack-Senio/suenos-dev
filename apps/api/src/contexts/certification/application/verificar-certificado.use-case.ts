import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  CertificadoRepository,
  CERTIFICADO_REPOSITORY,
} from '../domain/certificado.repository.port';
import { Certificado } from '../domain/certificado.entity';

@Injectable()
export class VerificarCertificadoUseCase {
  constructor(
    @Inject(CERTIFICADO_REPOSITORY)
    private readonly certificadoRepository: CertificadoRepository,
  ) {}

  async execute(id: string): Promise<Certificado> {
    const certificado = await this.certificadoRepository.findById(id);
    if (!certificado) {
      throw new NotFoundException(`Certificado con id ${id} no encontrado`);
    }
    return certificado;
  }
}
