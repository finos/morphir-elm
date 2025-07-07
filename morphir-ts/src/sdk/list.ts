import { List as IList, ValueObject, isImmutable } from 'immutable'
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
     * Create a list with a single element.
     * @param el the element to create the list with.
     * @returns a new list with the element.
     */
    static singleton<T>(el: T): List<T> {
        return new List<T>([el])
    }

    /**
     * Create a list of repeated elements.
     * @param count the number of times to repeat the element.
     * @param el the element to repeat.
     * @returns a new list with the repeated elements.
     *          If count is less than 0, an empty list is returned.
     *          If count is equal to 0, an empty list is returned.
     *          If count is greater than 0, a list with the repeated elements is returned.
     */
    static repeat<T>(count: number, el: T): List<T> {
        const els = new Array(count).fill(el)
        return new List<T>(els)
    }

    /**
     * Create a list of numbers within a range.
     * @param from the start of the range.
     * @param to the end of the range.
     * @returns a new list containing the numbers in the range.
     *          If from is greater than to, an empty list is returned.
     *          If from is equal to to, a list with a single element is returned.
     *          If from is less than to, a list with all numbers from from to to is returned.
     */
    static range(from: number, to: number): List<number> {
        if (from >= to) {
            return List.empty<number>()
        }
        const els = new Array(to - from + 1).map((_, i) => from + i)
        return new List<number>(els)
    }

    /**
     * Create a list from an iterable.
     * @param iterable the iterable to create the list from.
     * @returns a new list containing the elements from the iterable.
     */
    static from<T>(iterable: Iterable<T>): List<T> {
        return new List<T>(iterable)
    }

    constructor(iterable?: Iterable<T>) {
        super(IList<T>(iterable))
    }

    //

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
        return new List<T>(list.reduce((acc, next) => acc.concat(next.struct), this.struct))
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

    /**
     * Maps each value in this list to a new value.
     *
     * @param mapper function to map each value in the list
     * @template B the type of the mapped values
     * @returns a new list with the mapped values
     */
    map<B>(mapper: (value: T) => B): List<B> {
        return List.from<B>(this.struct.map(mapper))
    }

    /**
     * Converts this collection to a JavaScript array.
     * @return a JavaScript array with the elements of this collection
     */
    toArray(): T[] {
        return this.struct.toArray()
    }

    /**
     * Check if this list is equal to another list of the same type
     * @param other
     * @returns
     */
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
