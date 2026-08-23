import { ValueObject } from '../value-object';
interface UserIdProps {
    value: string;
}
export declare class UserId extends ValueObject<UserIdProps> {
    private constructor();
    get value(): string;
    static create(): UserId;
    static from(value: string): UserId;
}
export {};
