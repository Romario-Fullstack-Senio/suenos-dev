"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const entity_1 = require("./entity");
class AggregateRoot extends entity_1.Entity {
    _domainEvents = [];
    get domainEvents() {
        return this._domainEvents;
    }
    addDomainEvent(event) {
        this._domainEvents.push(event);
    }
    pullDomainEvents() {
        const events = [...this._domainEvents];
        this._domainEvents = [];
        return events;
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map