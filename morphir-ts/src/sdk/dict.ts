import { Map, ValueObject } from 'immutable'
import List from './list'
import BackedDataStructure from './backed-structure'

/**
 * A dictionary mapping unique keys to values. The keys can be any comparable type. This includes Int, Float, Time, Char, String, and tuples or lists of comparable types.
 * Insert, remove, and query operations all take O(log n) time.
 */
export default class Dict<K, V> extends BackedDataStructure<Map<K, V>> implements ValueObject {

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
        return new Dict<K, V>(Map(array.iterator))
    }

    private constructor(map: Map<K, V>) {
        super(map)
    }

    /**
     * Insert a key-value pair into this dictionary. Replaces value when there is a collision.
     * @param key to insert.
     * @param value to associate with provided key
     * @returns a new dictionary with the key-value pair inserted.
     */
    insert(key: K, value: V): Dict<K, V> {
        return new Dict(this.struct.set(key, value))
    }

    /**
     * Update the value of this dictionary for a specific key with a given function.
     * If the key is not present in the dictionary, the dictionary is returned unchanged.
     * @param key the key to update.
     * @param updater the function to apply to the value associated with the key.
     * @returns a new dictionary with the updated value.
     */
    update(key: K, updater: (value: V) => V): Dict<K, V> {
        if (this.member(key)) {
            return new Dict(this.struct.update(key, (v) => updater(v!)))
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
        return new Dict(this.struct.remove(key))
    }

    /**
     * Check if a key is present in the dictionary.
     * @param key the key to look up.
     * @returns true if the key is present, false otherwise.
     */
    member(key: K): boolean {
        return this.struct.has(key)
    }

    /**
     * Retrieve the value associated with a key in the dictionary.
     * @param key the key to look up.
     * @returns the value associated with the key, or undefined if the key is not found.
     */
    get(key: K): V | undefined {
        return this.struct.get(key)
    }

    /**
     * Fold over the the key-value pairs of this dictionary
     * @param reducer 
     * @param initialValue 
     * @returns 
     */
    foldl<R>(reducer: (acc: R, keyValuePair: [K, V]) => R, initialValue: R): R {
        return this.struct.reduce((acc, value, key) => reducer(acc, [key, value]), initialValue)
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
