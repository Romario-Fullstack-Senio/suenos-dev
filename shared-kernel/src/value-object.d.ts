export declare abstract class ValueObject<T> {
    protected readonly props: T;
    protected constructor(props: T);
    equals(other: ValueObject<T>): boolean;
}
