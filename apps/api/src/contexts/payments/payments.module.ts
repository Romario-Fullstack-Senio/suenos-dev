import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrdenOrmEntity } from './infrastructure/typeorm/orden.orm-entity';
import { OrdenTypeOrmRepository } from './infrastructure/typeorm/orden.typeorm-repository';
import { CrearOrdenUseCase } from './application/crear-orden.use-case';
import { StripeWebhookHandler } from './application/webhook/stripe-webhook.handler';
import { OrdenController } from './interfaces/orden.controller';
import { StripeWebhookController } from './interfaces/stripe-webhook.controller';
import { ORDEN_REPOSITORY } from './domain/orden.repository.port';
import { STRIPE_CHECKOUT } from './domain/stripe-checkout.port';
import { StripeCheckoutAdapter } from './infrastructure/stripe/stripe-checkout.adapter';
import { STRIPE_PAYMENT_INTENT } from './domain/stripe-payment-intent.port';
import { StripePaymentIntentAdapter } from './infrastructure/stripe/stripe-payment-intent.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdenOrmEntity]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [OrdenController, StripeWebhookController],
  providers: [
    {
      provide: ORDEN_REPOSITORY,
      useClass: OrdenTypeOrmRepository,
    },
    {
      provide: STRIPE_CHECKOUT,
      useClass: StripeCheckoutAdapter,
    },
    {
      provide: STRIPE_PAYMENT_INTENT,
      useClass: StripePaymentIntentAdapter,
    },
    CrearOrdenUseCase,
    StripeWebhookHandler,
  ],
})
export class PaymentsModule {}
