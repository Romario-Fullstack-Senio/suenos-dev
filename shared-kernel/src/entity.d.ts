export declare abstract class Entity<T> {
    protected readonly _id: T;
    protected readonly _createdAt: Date;
    private _updatedAt;
    protected constructor(id: T);
    get id(): T;
    get createdAt(): Date;
    get updatedAt(): Date;
    protected touch(): void;
    equals(other: Entity<T>): boolean;
}
