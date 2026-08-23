import { DomainEvent } from '@suenos-dev/shared-kernel';

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}