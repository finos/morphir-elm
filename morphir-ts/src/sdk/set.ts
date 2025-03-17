import { Set as ISet, ValueObject } from 'immutable'
import BackedDataStructure from './backed-structure'

/**
 * This module has functions to help you work with morphir Sets!
 */
export default class Set<T> extends BackedDataStructure<ISet<T>> implements ValueObject {
    /**
     * Create an empty list.
     */
    static empty<T>(): Set<T> {
        return new Set<T>()
    }

    /**
     * Create a Set from an iterable.
     * @param iterable the iterable to create the Set from.
     * @returns a new Set containing the elements from the iterable.
     */
    static from<T>(iterable: Iterable<T>): Set<T> {
        return new Set<T>(iterable)
    }

    static encoder<T>(encoder: (t: T) => any): (set: Set<T>) => any {
        return (set) => set.reduce((acc, value) => [...acc, encoder(value)], [])
    }   

    static decoder<T>(decoder: (v: any) => T): (input: any) => Set<T> {
        return input => Set.from(input.map(decoder))
    }

    private constructor(iterable?: Iterable<T>) {
         super(ISet<T>(iterable))
    }

    /**
     * Get the size of this Set.
     */
    get size(): number {
        return this.struct.size
    }

    /**
     * Get an iterator for this Set.
     */
    get iterator(): IterableIterator<T> {
        return this.struct.values()
    }

    
    add(value: T): Set<T> {
        return new Set<T>(this.struct.add(value))
    }

    remove(value: T): Set<T> {
        return new Set<T>(this.struct.remove(value))
    }

    union(list: Set<T>): Set<T> {
        return new Set<T>(this.struct.concat(list.struct))
    }

    reduce<R>(reducer: (acc: R, value: T) => R, initialValue: R): R {
        return this.struct.reduce(reducer, initialValue)
    }

    
    equals(other: Set<T>): boolean {
        return this.struct.equals(other.struct)
    }

    hashCode(): number {
        return this.struct.hashCode()
    }

    override toString(): string {
        return `List(${JSON.stringify(this.struct.toJS())})`
    }
}