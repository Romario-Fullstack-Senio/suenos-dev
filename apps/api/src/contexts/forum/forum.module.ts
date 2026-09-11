import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemaForoOrmEntity } from './infrastructure/typeorm/tema-foro.orm-entity';
import { RespuestaForoOrmEntity } from './infrastructure/typeorm/respuesta-foro.orm-entity';
import { TemaForoTypeOrmRepository } from './infrastructure/typeorm/tema-foro.typeorm-repository';
import { TEMA_FORO_REPOSITORY } from './domain/tema-foro.repository.port';
import { CrearTemaUseCase } from './application/crear-tema.use-case';
import { ResponderTemaUseCase } from './application/responder-tema.use-case';
import { ListarTemasUseCase } from './application/listar-temas.use-case';
import { ObtenerTemaUseCase } from './application/obtener-tema.use-case';
import { EliminarTemaUseCase } from './application/eliminar-tema.use-case';
import { FijarTemaUseCase } from './application/fijar-tema.use-case';
import { CerrarTemaUseCase } from './application/cerrar-tema.use-case';
import { ReportarTemaUseCase } from './application/reportar-tema.use-case';
import { RestaurarTemaUseCase } from './application/restaurar-tema.use-case';
import { ListarTemasReportadosUseCase } from './application/listar-temas-reportados.use-case';
import { ForoController } from './interfaces/foro.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [TypeOrmModule.forFeature([TemaForoOrmEntity, RespuestaForoOrmEntity]), IdentityModule],
  controllers: [ForoController],
  providers: [
    { provide: TEMA_FORO_REPOSITORY, useClass: TemaForoTypeOrmRepository },
    CrearTemaUseCase,
    ResponderTemaUseCase,
    ListarTemasUseCase,
    ObtenerTemaUseCase,
    EliminarTemaUseCase,
    FijarTemaUseCase,
    CerrarTemaUseCase,
    ReportarTemaUseCase,
    RestaurarTemaUseCase,
    ListarTemasReportadosUseCase,
  ],
})
export class ForumModule {}
