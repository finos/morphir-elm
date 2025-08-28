export default abstract class BackedDataStructure<T> {
    private __backingStructure__: T

    protected constructor(struct: T) {
        this.__backingStructure__ = struct
    }

    protected get struct(): T {
        return this.__backingStructure__
    }

    abstract toString(): string
}
