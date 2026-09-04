import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreguntaOrmEntity } from './infrastructure/typeorm/pregunta.orm-entity';
import { RespuestaOrmEntity } from './infrastructure/typeorm/respuesta.orm-entity';
import { PreguntaTypeOrmRepository } from './infrastructure/typeorm/pregunta.typeorm-repository';
import { PREGUNTA_REPOSITORY } from './domain/pregunta.repository.port';
import { CrearPreguntaUseCase } from './application/crear-pregunta.use-case';
import { ResponderPreguntaUseCase } from './application/responder-pregunta.use-case';
import { ListarPreguntasUseCase } from './application/listar-preguntas.use-case';
import { EliminarPreguntaUseCase } from './application/eliminar-pregunta.use-case';
import { MarcarResueltaUseCase } from './application/marcar-resuelta.use-case';
import { PreguntaController } from './interfaces/pregunta.controller';
import { CatalogModule } from '../catalog/catalog.module';
import { IdentityModule } from '../identity/identity.module';
import { ContentDeliveryModule } from '../content-delivery/content-delivery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PreguntaOrmEntity, RespuestaOrmEntity]),
    CatalogModule,
    IdentityModule, // re-exporta JwtModule — token opcional en el listado público
    ContentDeliveryModule, // reusa VerificarAccesoVideoUseCase para el control de acceso
  ],
  controllers: [PreguntaController],
  providers: [
    { provide: PREGUNTA_REPOSITORY, useClass: PreguntaTypeOrmRepository },
    CrearPreguntaUseCase,
    ResponderPreguntaUseCase,
    ListarPreguntasUseCase,
    EliminarPreguntaUseCase,
    MarcarResueltaUseCase,
  ],
})
export class QaModule {}
