import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResenaOrmEntity } from './infrastructure/typeorm/resena.orm-entity';
import { ResenaTypeOrmRepository } from './infrastructure/typeorm/resena.typeorm-repository';
import { RESENA_REPOSITORY } from './domain/resena.repository.port';
import { CrearOActualizarResenaUseCase } from './application/crear-o-actualizar-resena.use-case';
import { ListarResenasUseCase } from './application/listar-resenas.use-case';
import { ResumenResenasUseCase } from './application/resumen-resenas.use-case';
import { EliminarResenaUseCase } from './application/eliminar-resena.use-case';
import { ResenaController } from './interfaces/resena.controller';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { IdentityModule } from '../identity/identity.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [TypeOrmModule.forFeature([ResenaOrmEntity]), EnrollmentModule, IdentityModule, CatalogModule],
  controllers: [ResenaController],
  providers: [
    { provide: RESENA_REPOSITORY, useClass: ResenaTypeOrmRepository },
    CrearOActualizarResenaUseCase,
    ListarResenasUseCase,
    ResumenResenasUseCase,
    EliminarResenaUseCase,
  ],
  exports: [RESENA_REPOSITORY],
})
export class ReviewsModule {}
