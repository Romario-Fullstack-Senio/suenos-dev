import { Controller, Get, Post, Param, Body, UseGuards, Res, Inject } from '@nestjs/common';
import { Response } from 'express';
import { VerificarCertificadoUseCase } from '../application/verificar-certificado.use-case';
import { Certificado } from '../domain/certificado.entity';
import { CERTIFICADO_REPOSITORY, CertificadoRepository } from '../domain/certificado.repository.port';
import { LINKEDIN_LINK, LinkedInLink } from '../domain/linkedin-link.port';
import { PDF_GENERATOR, PdfGenerator } from '../domain/pdf-generator.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { randomUUID } from 'crypto';

@Controller('certificados')
export class CertificadoController {
  constructor(
    private readonly verificarCertificadoUseCase: VerificarCertificadoUseCase,
    @Inject(CERTIFICADO_REPOSITORY)
    private readonly certificadoRepository: CertificadoRepository,
    @Inject(LINKEDIN_LINK)
    private readonly linkedinLink: LinkedInLink,
    @Inject(PDF_GENERATOR)
    private readonly pdfGenerator: PdfGenerator,
  ) {}

  @Get(':id/verificar')
  async verificar(@Param('id') id: string) {
    const certificado = await this.verificarCertificadoUseCase.execute(id);

    return {
      valido: true,
      certificado: {
        estudiante: certificado.estudianteNombre,
        curso: certificado.cursoNombre,
        fechaEmision: certificado.fechaEmision,
        codigoVerificacion: certificado.codigoVerificacion,
        urlVerificacion: certificado.getVerifyUrl(),
        linkedinAddToProfile: this.linkedinLink.generate(certificado),
      },
    };
  }

  @Get(':id/pdf')
  async descargarPdf(@Param('id') id: string, @Res() res: Response) {
    const certificado = await this.verificarCertificadoUseCase.execute(id);
    const pdfBuffer = await this.pdfGenerator.generate(certificado);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-${certificado.codigoVerificacion}.pdf"`,
    });
    res.send(pdfBuffer);
  }

  @Get('estudiante/:estudianteId')
  @UseGuards(JwtAuthGuard)
  async listarPorEstudiante(@Param('estudianteId') estudianteId: string) {
    const certificados = await this.certificadoRepository.findByEstudianteId(estudianteId);
    return certificados.map(c => ({
      id: c.id,
      cursoId: c.cursoId,
      cursoNombre: c.cursoNombre,
      fechaEmision: c.fechaEmision,
      codigoVerificacion: c.codigoVerificacion,
      linkedinAddToProfile: this.linkedinLink.generate(c),
    }));
  }

  @Post('emitir')
  @UseGuards(JwtAuthGuard)
  async emitir(@Body() body: { estudianteId: string; cursoId: string; estudianteNombre: string; cursoNombre: string }) {
    const existing = await this.certificadoRepository.findByCursoYEstudiante(
      body.cursoId,
      body.estudianteId,
    );

    if (existing) {
      return {
        id: existing.id,
        estudianteNombre: existing.estudianteNombre,
        cursoNombre: existing.cursoNombre,
        message: 'Certificado ya emitido',
        linkedinAddToProfile: this.linkedinLink.generate(existing),
      };
    }

    const certificado = Certificado.emitir(
      randomUUID(),
      body.estudianteId,
      body.cursoId,
      body.estudianteNombre,
      body.cursoNombre,
    );

    await this.certificadoRepository.save(certificado);

    return {
      id: certificado.id,
      estudianteNombre: certificado.estudianteNombre,
      cursoNombre: certificado.cursoNombre,
      fechaEmision: certificado.fechaEmision,
      linkedinAddToProfile: this.linkedinLink.generate(certificado),
    };
  }
}
