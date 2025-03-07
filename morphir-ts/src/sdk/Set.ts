import { Set as iSet } from 'immutable'

export default class Set<T> {
    private iSet: iSet<T>

    static empty<T>(): Set<T> {
        return new Set<T>()
    }

    static from<T>(iterable: Iterable<T>): Set<T> {
        return new Set<T>(iterable)
    }

    private constructor(iterable?: Iterable<T>) {
        this.iSet = iSet<T>(iterable)
    }

    get length(): number {
        return this.iSet.size
    }

    get iterator(): IterableIterator<T> {
        return this.iSet.values()
    }

    push(value: T): Set<T> {
        return new Set<T>(this.iSet.add(value))
    }

    remove(value: T): Set<T> {
        return new Set<T>(this.iSet.remove(value))
    }

    concat(list: Set<T>): Set<T> {
        return new Set<T>(this.iSet.concat(list.iSet))
    }

    reduce<R>(reducer: (acc: R, value: T) => R, initialValue: R): R {
        return this.iSet.reduce(reducer, initialValue)
    }

    toArray(): T[] {
        return this.iSet.toArray()
    }
}