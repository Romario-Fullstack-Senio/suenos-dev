"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
class Entity {
    _id;
    _createdAt;
    _updatedAt;
    constructor(id) {
        this._id = id;
        this._createdAt = new Date();
        this._updatedAt = new Date();
    }
    get id() {
        return this._id;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    touch() {
        this._updatedAt = new Date();
    }
    equals(other) {
        if (other === null || other === undefined)
            return false;
        if (this === other)
            return true;
        return this._id === other._id;
    }
}
exports.Entity = Entity;
//# sourceMappingURL=entity.js.map