import { DomainEvent } from '@suenos-dev/shared-kernel';

export interface EventSubscriber {
  subscribe(eventName: string, handler: (event: DomainEvent) => void | Promise<void>): void;
}