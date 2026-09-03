import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { CommonModule } from './common/common.module';
import { DomainExceptionFilter } from './common/domain-exception.filter';
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
    // Caché en memoria para lecturas frecuentes de solo-lectura (ver CacheInterceptor
    // en CatalogModule). TTL corto por defecto; el store es intercambiable por Redis
    // (cache-manager-redis-yet) sin tocar el código que lo consume.
    CacheModule.register({
      isGlobal: true,
      ttl: 30000,
    }),
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
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
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
    // Registrado vía DI (no `useGlobalFilters(new SentryGlobalFilter())` en main.ts):
    // SentryGlobalFilter extiende BaseExceptionFilter y necesita que Nest le
    // inyecte HttpAdapterHost para inicializar `applicationRef`. Instanciado
    // manualmente con `new`, ese campo queda undefined y cualquier excepción
    // no controlada (404, 401, error de validación) tumba el proceso entero.
    // DomainExceptionFilter (@Catch(DomainError), específico) va DESPUÉS de
    // SentryGlobalFilter (catch-all) en este array: Nest prueba los filtros
    // globales en orden inverso de registro, así que el último en la lista
    // es el primero en evaluarse. Verificado empíricamente (ver auditoría).
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}