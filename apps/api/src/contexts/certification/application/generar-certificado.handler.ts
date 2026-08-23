import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { Certificado } from '../domain/certificado.entity';
import {
  CertificadoRepository,
  CERTIFICADO_REPOSITORY,
} from '../domain/certificado.repository.port';
import { PdfGenerator, PDF_GENERATOR } from '../domain/pdf-generator.port';

export class QuizAprobadoEvent {
  constructor(
    public readonly estudianteId: string,
    public readonly cursoId: string,
    public readonly estudianteNombre: string,
    public readonly cursoNombre: string,
  ) {}
}

@Injectable()
export class GenerarCertificadoHandler {
  constructor(
    @Inject(CERTIFICADO_REPOSITORY)
    private readonly certificadoRepository: CertificadoRepository,
    @Inject(PDF_GENERATOR)
    private readonly pdfGenerator: PdfGenerator,
  ) {}

  @OnEvent('QuizAprobado')
  async handle(event: QuizAprobadoEvent): Promise<void> {
    const id = randomUUID();
    const certificado = Certificado.emitir(
      id,
      event.estudianteId,
      event.cursoId,
      event.estudianteNombre,
      event.cursoNombre,
    );

    await this.pdfGenerator.generate(certificado);
    await this.certificadoRepository.save(certificado);
  }
}
