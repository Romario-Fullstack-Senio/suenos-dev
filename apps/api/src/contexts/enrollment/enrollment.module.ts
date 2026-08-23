import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InscripcionOrmEntity } from './infrastructure/typeorm/inscripcion.orm-entity';
import { InscripcionTypeOrmRepository } from './infrastructure/typeorm/inscripcion.typeorm-repository';
import { InscripcionController } from './interfaces/inscripcion.controller';
import { INSCRIPCION_REPOSITORY } from './domain/inscripcion.repository.port';
import { OtorgarAccesoHandler } from './application/otorgar-acceso.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([InscripcionOrmEntity]),
    EventEmitterModule,
  ],
  controllers: [InscripcionController],
  providers: [
    {
      provide: INSCRIPCION_REPOSITORY,
      useClass: InscripcionTypeOrmRepository,
    },
    OtorgarAccesoHandler,
  ],
  exports: [INSCRIPCION_REPOSITORY],
})
export class EnrollmentModule {}
