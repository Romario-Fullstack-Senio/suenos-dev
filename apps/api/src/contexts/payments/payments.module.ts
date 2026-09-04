import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrdenOrmEntity } from './infrastructure/typeorm/orden.orm-entity';
import { OrdenItemOrmEntity } from './infrastructure/typeorm/orden-item.orm-entity';
import { OrdenTypeOrmRepository } from './infrastructure/typeorm/orden.typeorm-repository';
import { CuponOrmEntity } from './infrastructure/typeorm/cupon.orm-entity';
import { CuponTypeOrmRepository } from './infrastructure/typeorm/cupon.typeorm-repository';
import { CrearOrdenUseCase } from './application/crear-orden.use-case';
import { ReembolsarOrdenUseCase } from './application/reembolsar-orden.use-case';
import { CrearCuponUseCase } from './application/crear-cupon.use-case';
import { ValidarCuponUseCase } from './application/validar-cupon.use-case';
import { ListarCuponesUseCase } from './application/listar-cupones.use-case';
import { DesactivarCuponUseCase } from './application/desactivar-cupon.use-case';
import { StripeWebhookHandler } from './application/webhook/stripe-webhook.handler';
import { OrdenController } from './interfaces/orden.controller';
import { CuponController } from './interfaces/cupon.controller';
import { StripeWebhookController } from './interfaces/stripe-webhook.controller';
import { ORDEN_REPOSITORY } from './domain/orden.repository.port';
import { CUPON_REPOSITORY } from './domain/cupon.repository.port';
import { STRIPE_CHECKOUT } from './domain/stripe-checkout.port';
import { StripeCheckoutAdapter } from './infrastructure/stripe/stripe-checkout.adapter';
import { STRIPE_PAYMENT_INTENT } from './domain/stripe-payment-intent.port';
import { StripePaymentIntentAdapter } from './infrastructure/stripe/stripe-payment-intent.adapter';
import { FACTURA_GENERATOR } from './domain/factura-generator.port';
import { FacturaPdfKitAdapter } from './infrastructure/pdf/factura-pdfkit.adapter';
import { IdentityModule } from '../identity/identity.module';
import { CatalogModule } from '../catalog/catalog.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { BundlesModule } from '../bundles/bundles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdenOrmEntity, OrdenItemOrmEntity, CuponOrmEntity]),
    EventEmitterModule.forRoot(),
    IdentityModule,
    CatalogModule,
    EnrollmentModule,
    BundlesModule,
  ],
  controllers: [OrdenController, CuponController, StripeWebhookController],
  providers: [
    {
      provide: ORDEN_REPOSITORY,
      useClass: OrdenTypeOrmRepository,
    },
    {
      provide: CUPON_REPOSITORY,
      useClass: CuponTypeOrmRepository,
    },
    {
      provide: STRIPE_CHECKOUT,
      useClass: StripeCheckoutAdapter,
    },
    {
      provide: STRIPE_PAYMENT_INTENT,
      useClass: StripePaymentIntentAdapter,
    },
    {
      provide: FACTURA_GENERATOR,
      useClass: FacturaPdfKitAdapter,
    },
    CrearOrdenUseCase,
    ReembolsarOrdenUseCase,
    CrearCuponUseCase,
    ValidarCuponUseCase,
    ListarCuponesUseCase,
    DesactivarCuponUseCase,
    StripeWebhookHandler,
  ],
  exports: [ORDEN_REPOSITORY],
})
export class PaymentsModule {}
