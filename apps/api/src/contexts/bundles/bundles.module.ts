import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaqueteOrmEntity } from './infrastructure/typeorm/paquete.orm-entity';
import { PaqueteTypeOrmRepository } from './infrastructure/typeorm/paquete.typeorm-repository';
import { PAQUETE_REPOSITORY } from './domain/paquete.repository.port';
import { CrearPaqueteUseCase } from './application/crear-paquete.use-case';
import { ActualizarPaqueteUseCase } from './application/actualizar-paquete.use-case';
import { CambiarEstadoPaqueteUseCase } from './application/cambiar-estado-paquete.use-case';
import { EliminarPaqueteUseCase } from './application/eliminar-paquete.use-case';
import { PaqueteController } from './interfaces/paquete.controller';
import { CatalogModule } from '../catalog/catalog.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaqueteOrmEntity]), CatalogModule, IdentityModule],
  controllers: [PaqueteController],
  providers: [
    { provide: PAQUETE_REPOSITORY, useClass: PaqueteTypeOrmRepository },
    CrearPaqueteUseCase,
    ActualizarPaqueteUseCase,
    CambiarEstadoPaqueteUseCase,
    EliminarPaqueteUseCase,
  ],
  exports: [PAQUETE_REPOSITORY],
})
export class BundlesModule {}
