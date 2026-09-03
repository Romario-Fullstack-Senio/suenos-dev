import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus';
import { OwnershipGuard } from './guards/ownership.guard';
import { HealthController } from './health.controller';

@Global()
@Module({
  controllers: [HealthController],
  providers: [EventBus, OwnershipGuard],
  exports: [EventBus, OwnershipGuard],
})
export class CommonModule {}
