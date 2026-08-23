import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursoController } from './interfaces/curso.controller';
import { CrearCursoUseCase } from './application/crear-curso.use-case';
import { PublicarCursoUseCase } from './application/publicar-curso.use-case';
import { AgregarModuloUseCase } from './application/agregar-modulo.use-case';
import { AgregarLeccionUseCase } from './application/agregar-leccion.use-case';
import { CursoTypeOrmRepository } from './infrastructure/typeorm/curso.typeorm-repository';
import { CursoOrmEntity } from './infrastructure/typeorm/curso.orm-entity';
import { ModuloOrmEntity } from './infrastructure/typeorm/modulo.orm-entity';
import { LeccionOrmEntity } from './infrastructure/typeorm/leccion.orm-entity';
import { CURSO_REPOSITORY } from './domain/curso.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([CursoOrmEntity, ModuloOrmEntity, LeccionOrmEntity])],
  controllers: [CursoController],
  providers: [
    { provide: CURSO_REPOSITORY, useClass: CursoTypeOrmRepository },
    CrearCursoUseCase,
    PublicarCursoUseCase,
    AgregarModuloUseCase,
    AgregarLeccionUseCase,
  ],
  exports: [CURSO_REPOSITORY],
})
export class CatalogModule {}
