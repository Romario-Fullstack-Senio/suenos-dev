import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus';
import { OwnershipGuard } from './guards/ownership.guard';

@Global()
@Module({
  providers: [EventBus, OwnershipGuard],
  exports: [EventBus, OwnershipGuard],
})
export class CommonModule {}
