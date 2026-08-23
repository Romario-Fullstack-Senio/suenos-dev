import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgresoLeccionOrmEntity } from './infrastructure/typeorm/progreso-leccion.orm-entity';
import { ProgresoLeccionTypeormRepository } from './infrastructure/typeorm/progreso-leccion.typeorm-repository';
import { MinioVideoStorageAdapter } from './infrastructure/minio/minio-video-storage.adapter';
import { RegistrarProgresoUseCase } from './application/registrar-progreso.use-case';
import { SubirVideoUseCase } from './application/subir-video.use-case';
import { VideoController } from './interfaces/video.controller';
import { ProgresoController } from './interfaces/progreso.controller';
import {
  PROGRESO_LECCION_REPOSITORY,
  VIDEO_STORAGE,
} from './domain/progreso-leccion.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([ProgresoLeccionOrmEntity])],
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
  ],
})
export class ContentDeliveryModule {}
