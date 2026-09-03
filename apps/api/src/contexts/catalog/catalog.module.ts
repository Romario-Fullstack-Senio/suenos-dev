import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursoController } from './interfaces/curso.controller';
import { CrearCursoUseCase } from './application/crear-curso.use-case';
import { PublicarCursoUseCase } from './application/publicar-curso.use-case';
import { AgregarModuloUseCase } from './application/agregar-modulo.use-case';
import { AgregarLeccionUseCase } from './application/agregar-leccion.use-case';
import { SubirImagenCursoUseCase } from './application/subir-imagen-curso.use-case';
import { EditarCursoUseCase } from './application/editar-curso.use-case';
import { CambiarEstadoCursoUseCase } from './application/cambiar-estado-curso.use-case';
import { EliminarCursoUseCase } from './application/eliminar-curso.use-case';
import { CursoTypeOrmRepository } from './infrastructure/typeorm/curso.typeorm-repository';
import { CursoOrmEntity } from './infrastructure/typeorm/curso.orm-entity';
import { ModuloOrmEntity } from './infrastructure/typeorm/modulo.orm-entity';
import { LeccionOrmEntity } from './infrastructure/typeorm/leccion.orm-entity';
import { CURSO_REPOSITORY } from './domain/curso.repository.port';
import { IMAGE_STORAGE } from './domain/image-storage.port';
import { MinioImageStorageAdapter } from './infrastructure/minio/minio-image-storage.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([CursoOrmEntity, ModuloOrmEntity, LeccionOrmEntity])],
  controllers: [CursoController],
  providers: [
    { provide: CURSO_REPOSITORY, useClass: CursoTypeOrmRepository },
    { provide: IMAGE_STORAGE, useClass: MinioImageStorageAdapter },
    CrearCursoUseCase,
    PublicarCursoUseCase,
    AgregarModuloUseCase,
    AgregarLeccionUseCase,
    SubirImagenCursoUseCase,
    EditarCursoUseCase,
    CambiarEstadoCursoUseCase,
    EliminarCursoUseCase,
  ],
  exports: [CURSO_REPOSITORY],
})
export class CatalogModule {}
