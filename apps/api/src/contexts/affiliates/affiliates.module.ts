import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ComisionAfiliadoOrmEntity } from './infrastructure/typeorm/comision-afiliado.orm-entity';
import { ComisionAfiliadoTypeOrmRepository } from './infrastructure/typeorm/comision-afiliado.typeorm-repository';
import { COMISION_AFILIADO_REPOSITORY } from './domain/comision-afiliado.repository.port';
import { RegistrarComisionHandler } from './application/registrar-comision.handler';
import { ObtenerResumenAfiliadoUseCase } from './application/obtener-resumen-afiliado.use-case';
import { ListarComisionesAdminUseCase } from './application/listar-comisiones-admin.use-case';
import { MarcarComisionPagadaUseCase } from './application/marcar-comision-pagada.use-case';
import { AfiliadosController } from './interfaces/afiliados.controller';
import { IdentityModule } from '../identity/identity.module';

// Regla de negocio (ver PORCENTAJE_COMISION en el dominio): 20% fijo del
// precio pagado, atribución "primer contacto" al registrarse (no cambia
// después), comisión pendiente hasta que un admin la marca pagada a mano
// — no hay integración con Stripe Connect ni ningún otro desembolso
// automático todavía, es una operación manual.
@Module({
  imports: [
    TypeOrmModule.forFeature([ComisionAfiliadoOrmEntity]),
    EventEmitterModule,
    IdentityModule,
  ],
  controllers: [AfiliadosController],
  providers: [
    { provide: COMISION_AFILIADO_REPOSITORY, useClass: ComisionAfiliadoTypeOrmRepository },
    RegistrarComisionHandler,
    ObtenerResumenAfiliadoUseCase,
    ListarComisionesAdminUseCase,
    MarcarComisionPagadaUseCase,
  ],
})
export class AffiliatesModule {}
