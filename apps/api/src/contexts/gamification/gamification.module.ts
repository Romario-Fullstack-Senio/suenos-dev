import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PerfilGamificacionOrmEntity } from './infrastructure/typeorm/perfil-gamificacion.orm-entity';
import { PerfilGamificacionTypeOrmRepository } from './infrastructure/typeorm/perfil-gamificacion.typeorm-repository';
import { PERFIL_GAMIFICACION_REPOSITORY } from './domain/perfil-gamificacion.repository.port';
import { RegistrarLeccionCompletadaHandler } from './application/registrar-leccion-completada.handler';
import { RegistrarCursoCompradoHandler } from './application/registrar-curso-comprado.handler';
import { RegistrarQuizAprobadoHandler } from './application/registrar-quiz-aprobado.handler';
import { ObtenerPerfilGamificacionUseCase } from './application/obtener-perfil-gamificacion.use-case';
import { ObtenerRankingUseCase } from './application/obtener-ranking.use-case';
import { GamificacionController } from './interfaces/gamificacion.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PerfilGamificacionOrmEntity]),
    EventEmitterModule,
    IdentityModule, // ObtenerRankingUseCase necesita USUARIO_REPOSITORY
  ],
  controllers: [GamificacionController],
  providers: [
    { provide: PERFIL_GAMIFICACION_REPOSITORY, useClass: PerfilGamificacionTypeOrmRepository },
    RegistrarLeccionCompletadaHandler,
    RegistrarCursoCompradoHandler,
    RegistrarQuizAprobadoHandler,
    ObtenerPerfilGamificacionUseCase,
    ObtenerRankingUseCase,
  ],
})
export class GamificationModule {}
