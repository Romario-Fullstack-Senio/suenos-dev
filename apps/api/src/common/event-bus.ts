import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@suenos-dev/shared-kernel';

@Injectable()
export class EventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    this.emitter.emit(event.eventName, event);
  }

  on(eventName: string, handler: (event: DomainEvent) => void | Promise<void>): void {
    this.emitter.on(eventName, handler);
  }
}