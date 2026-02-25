import { List as IList, ValueObject } from 'immutable'
import BackedDataStructure from './backed-structure'


/**
 * This module has a bunch of functions to help you work with morphir Lists!
 */
export default class List<T> extends BackedDataStructure<IList<T>> implements ValueObject {

    /**
     * Create an empty list.
     */
    static empty<T>(): List<T> {
        return new List<T>()
    }

    /**
     * Create a list from an iterable.
     * @param iterable the iterable to create the list from.
     * @returns a new list containing the elements from the iterable.
     */
    static from<T>(iterable: Iterable<T>): List<T> {
        return new List<T>(iterable)
    }

    private constructor(iterable?: Iterable<T>) {
        super(IList<T>(iterable))
    }

    /**
     * Get the length of this list.
     */
    get length(): number {
        return this.struct.size
    }

    /**
     * Get an iterator for this list.
     */
    get iterator(): IterableIterator<T> {
        return this.struct.values()
    }

    /**
     * Adds a value to the end of this list.
     * @param value the value to append.
     * @returns a new list with the value appended.
     */
    append(value: T): List<T> {
        return new List<T>(this.struct.push(value))
    }

    /**
     * Adds a value to the start of this list.
     * @param value the value to prepend.
     * @returns a new list with the value prepended.
     */
    prepend(value: T): List<T> {
        return new List<T>(this.struct.unshift(value))
    }

    /**
     * Removes the last value from this list.
     * @returns a new list with the last value removed.
     */
    concat(...list: List<T>[]): List<T> {
        return new List<T>(list.reduce((acc, next) =>
            acc.concat(next.struct), this.struct
        ))
    }

    /**
     * Reduce this list from the left.
     * @param reducer reducer function
     * @param initialValue starting value
     * @returns the reduced value
     */
    foldl<R>(reducer: (acc: R, value: T) => R, initialValue: R): R {
        return this.struct.reduce(reducer, initialValue)
    }

    equals(other: List<T>): boolean {
        return this.struct.equals(other.struct)
    }

    hashCode(): number {
        return this.struct.hashCode()
    }

    override toString(): string {
        return `List(${JSON.stringify(this.struct.toJS())})`
    }
}