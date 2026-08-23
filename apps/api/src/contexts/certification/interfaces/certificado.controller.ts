import { Controller, Get, Post, Param, Body, UseGuards, NotFoundException, Inject } from '@nestjs/common';
import { VerificarCertificadoUseCase } from '../application/verificar-certificado.use-case';
import { Certificado } from '../domain/certificado.entity';
import { CERTIFICADO_REPOSITORY, CertificadoRepository } from '../domain/certificado.repository.port';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { randomUUID } from 'crypto';

@Controller('certificados')
export class CertificadoController {
  constructor(
    private readonly verificarCertificadoUseCase: VerificarCertificadoUseCase,
    @Inject(CERTIFICADO_REPOSITORY)
    private readonly certificadoRepository: CertificadoRepository,
  ) {}

  @Get(':id/verificar')
  async verificar(@Param('id') id: string) {
    const certificado: Certificado =
      await this.verificarCertificadoUseCase.execute(id);

    return {
      valido: true,
      certificado: {
        estudiante: certificado.estudianteNombre,
        curso: certificado.cursoNombre,
        fechaEmision: certificado.fechaEmision,
        codigoVerificacion: certificado.codigoVerificacion,
        urlVerificacion: certificado.getVerifyUrl(),
      },
    };
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
        message: 'Certificado ya emitido',
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
      cursoNombre: certificado.cursoNombre,
      fechaEmision: certificado.fechaEmision,
    };
  }
}
