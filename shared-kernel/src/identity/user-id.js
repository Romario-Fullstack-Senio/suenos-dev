"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserId = void 0;
const uuid_1 = require("uuid");
const value_object_1 = require("../value-object");
class UserId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    get value() {
        return this.props.value;
    }
    static create() {
        return new UserId({ value: (0, uuid_1.v4)() });
    }
    static from(value) {
        return new UserId({ value });
    }
}
exports.UserId = UserId;
//# sourceMappingURL=user-id.js.map