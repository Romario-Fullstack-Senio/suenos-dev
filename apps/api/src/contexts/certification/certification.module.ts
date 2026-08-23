import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CertificadoOrmEntity } from './infrastructure/typeorm/certificado.orm-entity';
import { CertificadoTypeOrmRepository } from './infrastructure/typeorm/certificado.typeorm-repository';
import { CERTIFICADO_REPOSITORY } from './domain/certificado.repository.port';
import { GenerarCertificadoHandler } from './application/generar-certificado.handler';
import { VerificarCertificadoUseCase } from './application/verificar-certificado.use-case';
import { CertificadoController } from './interfaces/certificado.controller';
import { PDF_GENERATOR } from './domain/pdf-generator.port';
import { PdfKitAdapter } from './infrastructure/pdf/pdfkit.adapter';
import { LINKEDIN_LINK } from './domain/linkedin-link.port';
import { LinkedInAdapter } from './infrastructure/linkedin/linkedin.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificadoOrmEntity]),
    EventEmitterModule,
  ],
  controllers: [CertificadoController],
  providers: [
    {
      provide: CERTIFICADO_REPOSITORY,
      useClass: CertificadoTypeOrmRepository,
    },
    {
      provide: PDF_GENERATOR,
      useClass: PdfKitAdapter,
    },
    {
      provide: LINKEDIN_LINK,
      useClass: LinkedInAdapter,
    },
    GenerarCertificadoHandler,
    VerificarCertificadoUseCase,
  ],
  exports: [CERTIFICADO_REPOSITORY, VerificarCertificadoUseCase],
})
export class CertificationModule {}
