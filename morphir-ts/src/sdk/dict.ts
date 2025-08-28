import { Map as IMap, ValueObject, fromJS, FromJS, isImmutable, Collection } from 'immutable'
import List from './list'
import BackedDataStructure from './backed-structure'

/**
 * A dictionary mapping unique keys to values. The keys can be any comparable type.
 * This includes Int, Float, Time, Char, String, and tuples or lists of comparable types.
 * Insert, remove, and query operations all take O(log n) time.
 *
 * @note: If the keys are regular JavaScript types, they will be converted to immutable types.
 * This is to ensure that the keys are comparable and can be used in the dictionary.
 * If the keys are already immutable types, they will be used as is.
 *
 */
export default class Dict<K, V> extends BackedDataStructure<IMap<K, V>> implements ValueObject {
    /**
     * Create an empty dictionary.
     * @returns a new empty dictionary.
     */
    static empty<K, V>(): Dict<K, V> {
        return this.fromList(List.empty())
    }

    /**
     * Convert an association list into a dictionary.
     * @param array association list to convert.
     * @returns a new dictionary containing the key-value pairs from the association list.
     */
    static fromList<K, V>(array: List<[K, V]>): Dict<K, V> {
        return new Dict<K, V>(IMap<K, V>(array.map<[K, V]>(([k, v]) => [fromJS(k) as K, v]).iterator))
    }

    /**
     * Convert an array of tuples into a dictionary.
     * @param tuples array of tuples to convert.
     * @returns a new dictionary containing the key-value pairs from tuples.
     */
    static fromTuples<K, V>(tuples: [K, V][]): Dict<K, V> {
        return new Dict<K, V>(IMap(tuples.map(([key, value]) => [fromJS(key) as K, value])))
    }

    private constructor(map: IMap<K, V>) {
        super(map)
    }

    /**
     * Returns an array of the keys of this Collection, discarding values.
     * @returns an arrray of keys.
     */
    get keys(): K[] {
        return this.struct
            .keySeq()
            .map(k => {
                if (isImmutable(k)) {
                    return (k as any).toJS()
                } else {
                    return k
                }
            })
            .toJS() as K[]
    }

    /**
     * Returns an array of the values of this Collection, discarding keys.
     * @returns an arrray of values.
     */
    get values(): V[] {
        return this.struct.valueSeq().toJS() as V[]
    }

    /**
     * Insert a key-value pair into this dictionary. Replaces value when there is a collision.
     * @param key to insert.
     * @param value to associate with provided key
     * @returns a new dictionary with the key-value pair inserted.
     */
    insert(key: K, value: V): Dict<K, V> {
        return new Dict(this.struct.set(fromJS(key) as K, value))
    }

    /**
     * Update the value of this dictionary for a specific key with a given function.
     * If the key is not present in the dictionary, the dictionary is returned unchanged.
     * @param key the key to update.
     * @param updater the function to apply to the value associated with the key.
     * @returns a new dictionary with the updated value.
     */
    update(key: K, updater: (value: V) => V): Dict<K, V> {
        const imKey = fromJS(key) as K
        if (this.member(imKey)) {
            return new Dict(this.struct.update(imKey, v => updater(v!)))
        } else {
            return this
        }
    }

    /**
     * Remove a key-value pair from a dictionary. If the key is not found, no changes are made.
     * @param key the key to remove.
     * @returns a new dictionary with the key-value pair removed.
     */
    remove(key: K): Dict<K, V> {
        return new Dict(this.struct.remove(fromJS(key) as K))
    }

    /**
     * Check if a key is present in the dictionary.
     * @param key the key to look up.
     * @returns true if the key is present, false otherwise.
     */
    member(key: K): boolean {
        return this.struct.has(fromJS(key) as K)
    }

    /**
     * Retrieve the value associated with a key in the dictionary.
     * @param key the key to look up.
     * @returns the value associated with the key, or undefined if the key is not found.
     */
    get(key: K): V | undefined {
        return this.struct.get(fromJS(key) as K)
    }

    /**
     * Fold over the the key-value pairs of this dictionary
     * @param reducer
     * @param initialValue
     * @returns
     */
    foldl<R>(reducer: (acc: R, keyValuePair: [K, V]) => R, initialValue: R): R {
        return this.struct.reduce((acc, value, key) => {
            if (isImmutable(key)) return reducer(acc, [(key as any).toJS() as K, value])
            else return reducer(acc, [key, value])
        }, initialValue)
    }

    /**
     * Combine this dictionary with another of the same type.
     * If there is a collision, preference is given to the items in the other dictionary.
     * @param other
     * @returns
     */
    union(other: Dict<K, V>): Dict<K, V> {
        return new Dict(this.struct.merge(other.struct))
    }

    /**
     * Check if this dictionary is equal to another dictionary.
     * @param other the dictionary to compare to.
     * @returns true if the dictionaries are equal, false otherwise.
     */
    equals(other: Dict<K, V>): boolean {
        return this.struct.equals(other.struct)
    }

    hashCode(): number {
        return this.struct.hashCode()
    }

    /**
     * returns the string representation of the dictionary
     * @returns the string representation of the dictionary
     */
    toString(): string {
        return `Dict(${JSON.stringify(this.struct.toJS())})`
    }
}
