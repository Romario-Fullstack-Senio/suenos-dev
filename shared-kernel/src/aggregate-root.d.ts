import { Entity } from './entity';
import { DomainEvent } from './domain-event';
export declare abstract class AggregateRoot<T> extends Entity<T> {
    private _domainEvents;
    get domainEvents(): ReadonlyArray<DomainEvent>;
    protected addDomainEvent(event: DomainEvent): void;
    pullDomainEvents(): DomainEvent[];
}
