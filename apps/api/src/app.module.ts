import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { AdminController } from './common/admin.controller';
import { InstructorController } from './common/instructor.controller';
import { IdentityModule } from './contexts/identity/identity.module';
import { CatalogModule } from './contexts/catalog/catalog.module';
import { ContentDeliveryModule } from './contexts/content-delivery/content-delivery.module';
import { AssessmentModule } from './contexts/assessment/assessment.module';
import { CertificationModule } from './contexts/certification/certification.module';
import { PaymentsModule } from './contexts/payments/payments.module';
import { EnrollmentModule } from './contexts/enrollment/enrollment.module';
import { NotificationsModule } from './contexts/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    CommonModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER', 'postgres'),
        password: config.get('DATABASE_PASSWORD', 'admin'),
        database: config.get('DATABASE_NAME', 'suenos-dev'),
        autoLoadEntities: true,
        synchronize: true, // TODO: disable in production
      }),
    }),
    IdentityModule,
    CatalogModule,
    ContentDeliveryModule,
    AssessmentModule,
    CertificationModule,
    PaymentsModule,
    EnrollmentModule,
    NotificationsModule,
  ],
  controllers: [AdminController, InstructorController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}