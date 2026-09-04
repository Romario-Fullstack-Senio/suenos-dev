import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgresoLeccionOrmEntity } from './infrastructure/typeorm/progreso-leccion.orm-entity';
import { ProgresoLeccionTypeormRepository } from './infrastructure/typeorm/progreso-leccion.typeorm-repository';
import { MinioVideoStorageAdapter } from './infrastructure/minio/minio-video-storage.adapter';
import { RegistrarProgresoUseCase } from './application/registrar-progreso.use-case';
import { SubirVideoUseCase } from './application/subir-video.use-case';
import { SubirSubtitulosUseCase } from './application/subir-subtitulos.use-case';
import { SubirRecursoUseCase } from './application/subir-recurso.use-case';
import { EliminarRecursoUseCase } from './application/eliminar-recurso.use-case';
import { VerificarAccesoVideoUseCase } from './application/verificar-acceso-video.use-case';
import { VideoController } from './interfaces/video.controller';
import { ProgresoController } from './interfaces/progreso.controller';
import {
  PROGRESO_LECCION_REPOSITORY,
  VIDEO_STORAGE,
} from './domain/progreso-leccion.repository.port';
import { CatalogModule } from '../catalog/catalog.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgresoLeccionOrmEntity]),
    CatalogModule,
    EnrollmentModule,
    IdentityModule, // re-exporta JwtModule — necesario para verificar el token opcional en VideoController
  ],
  controllers: [VideoController, ProgresoController],
  providers: [
    {
      provide: PROGRESO_LECCION_REPOSITORY,
      useClass: ProgresoLeccionTypeormRepository,
    },
    {
      provide: VIDEO_STORAGE,
      useClass: MinioVideoStorageAdapter,
    },
    RegistrarProgresoUseCase,
    SubirVideoUseCase,
    SubirSubtitulosUseCase,
    SubirRecursoUseCase,
    EliminarRecursoUseCase,
    VerificarAccesoVideoUseCase,
  ],
  // VerificarAccesoVideoUseCase también lo reusa QaModule — mismo criterio
  // de "quién puede ver esta lección" para saber quién puede preguntar/
  // responder sobre ella, sin duplicar la lógica de inscripción/preview.
  exports: [PROGRESO_LECCION_REPOSITORY, VerificarAccesoVideoUseCase],
})
export class ContentDeliveryModule {}
