import { Set as ISet, ValueObject } from 'immutable'
import BackedDataStructure from './backed-structure'

export namespace Set {

    export function encodeSet<T>(
        encodeElement: (value: T) => any,
        set: Set<T>
    ): any {
        // this is currently stubbed to conform with the expected interface, but is not needed in practice
        throw new Error("Set.encodeSet is not currently implemented")
    }

    export function decodeSet<T>(
        decodeElement: (value: any) => T,
        set: Set<T>
    ): any {
        // this is currently stubbed to conform with the expected interface, but is not needed in practice
        throw new Error("Set.decodeSet is not currently implemented")
    }

    /**
     * This module has functions to help you work with morphir Sets!
     */
    export class Set<T> extends BackedDataStructure<ISet<T>> implements ValueObject {
        /**
         * Create an empty set.
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

        /**
         * Add a value to the set.
         * @param value The value to add.
         * @returns A new set with the value added.
         */
        add(value: T): Set<T> {
            return new Set<T>(this.struct.add(value))
        }


        /**
         * Remove a value from the set.
         * @param value The value to remove.
         * @returns A new set with the value removed.
         */
        remove(value: T): Set<T> {
            return new Set<T>(this.struct.remove(value))
        }

        /**
         * Check if a value is a member of the set.
         * @param value The value to check for membership.
         * @returns True if the value is in the set, false otherwise.
         */
        member(value: T): boolean {
            return this.struct.has(value);
        }


        /**
         * Return the union of this set and another set.
         * @param list The set to union with.
         * @returns A new set containing all elements from both sets.
         */
        union(list: Set<T>): Set<T> {
            return new Set<T>(this.struct.concat(list.struct))
        }


        /**
         * Reduce the set to a single value using a reducer function.
         * @param reducer The reducer function.
         * @param initialValue The initial value for the reduction.
         * @returns The reduced value.
         */
        reduce<R>(reducer: (acc: R, value: T) => R, initialValue: R): R {
            return this.struct.reduce(reducer, initialValue)
        }

        

        /**
         * Check if this set is equal to another set.
         * @param other The set to compare with.
         * @returns True if the sets are equal, false otherwise.
         */
        equals(other: Set<T>): boolean {
            return this.struct.equals(other.struct)
        }


        /**
         * Get the hash code for this set.
         * @returns The hash code as a number.
         */
        hashCode(): number {
            return this.struct.hashCode()
        }


        /**
         * Get a string representation of the set.
         * @returns A string representing the set.
         */
        override toString(): string {
            return `Set(${JSON.stringify(this.struct.toJS())})`
        }
    }
}