import { Controller, Get, Param, UseGuards, Res, Inject } from '@nestjs/common';
import { Response } from 'express';
import { VerificarCertificadoUseCase } from '../application/verificar-certificado.use-case';
import { CERTIFICADO_REPOSITORY, CertificadoRepository } from '../domain/certificado.repository.port';
import { LINKEDIN_LINK, LinkedInLink } from '../domain/linkedin-link.port';
import { PDF_GENERATOR, PdfGenerator } from '../domain/pdf-generator.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../../common/guards/ownership.guard';
import { RequireOwnership } from '../../../common/decorators/ownership.decorator';

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

  // La lista de certificados de un alumno es suya: sin OwnershipGuard,
  // cualquier usuario logueado podía enumerar los de otro cambiando el id.
  // (La verificación pública de UN certificado por su id sigue abierta a
  // propósito — es el punto de /certificados/:id/verificar.)
  @Get('estudiante/:estudianteId')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @RequireOwnership({ paramName: 'estudianteId' })
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

  // No hay endpoint para emitir certificados a mano: los emite solo
  // GenerarCertificadoHandler al aprobar el quiz (evento QuizAprobado).
  // Había un POST /certificados/emitir que cualquier usuario logueado podía
  // llamar con estudianteId, cursoId y los nombres en texto libre, sin haber
  // terminado el curso — y /verificar después lo daba por válido.
}
