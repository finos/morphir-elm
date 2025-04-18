type Just<T> = {
    readonly kind: 'Just';
    readonly value: T;
}

type Nothing = {
    readonly kind: 'Nothing';
}

interface MaybeOps<T> {
    /**
     * Provide a default value, turning an optional value into a normal value. 
     * @param defaultValue the default value to use if the Maybe is Nothing.
     * @return the value of the Maybe, or the default value if it is Nothing.
     * @example
     * ```ts
     * const maybeValue = Maybe.Just(42);
     * const result = maybeValue.withDefault(0); // result is 42
     * ...
     * const maybeValue = Maybe.Nothing<number>();
     * const result = maybeValue.withDefault(0); // result is 0
     * ```
     */
    withDefault(defaultValue: T): T;
    /**
     * Transform a Maybe value with a given function
     * @param fn the function to apply to the value if it is Just.
     * @return a new Maybe value, which is Just if the original was Just, or Nothing if it was Nothing.
     * @example
     * ```ts
     * const maybeValue = Maybe.Just(42);
     * const result = maybeValue.map(x => x * 2); // result is Just(84)
     * ...
     * const maybeValue = Maybe.Nothing<number>();
     * const result = maybeValue.map(x => x * 2); // result is Nothing
     * ```
     */
    map<U>(fn: (value: T) => U): Maybe<U>;
    /**
     * Chain together many computations that may fail.
     * @param fn the function to apply to the value if it is Just.
     * @return a new Maybe value, which is Just if the original was Just and the function returned Just, or Nothing if it was Nothing or the function returned Nothing.
     * @example
     * ```ts
     * const toInt = (x: string): Maybe<number> => {
     *      const parsed = parseInt(x, 10);
     *      return isNaN(parsed) ? Maybe.Nothing() : Maybe.Just(parsed);
     * };
     * const toValidMonth = (month: number): Maybe<number> => {
     *      return month >= 1 && month <= 12 ? Maybe.Just(month) : Maybe.Nothing();
     * };
     * const parseMonth = (input: string): Maybe<number> => toInt(input).andThen(toValidMonth);
     * 
     * const result1 = parseMonth("5"); // Just(5)
     * const result2 = parseMonth("13"); // Nothing
     * ```
     */
    andThen<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
}

/**
 * Represent values that may or may not exist. 
 * It can be useful if you have a record field that is only filled in sometimes. 
 * Or if a function takes a value sometimes, but does not absolutely need it.
 */
export type Maybe<T> = (Just<T> | Nothing) & MaybeOps<T>;

function MaybeOps<T>(maybe: Just<T> | Nothing): MaybeOps<T> {
    return {
        withDefault(defaultValue: T): T {
            if (maybe.kind === 'Just') {
                return maybe.value;
            }
            return defaultValue;
        },

        map<U>(fn: (value: T) => U): Maybe<U> {
            if (maybe.kind === 'Just') {
                return Just(fn(maybe.value));
            }
            return Nothing();
        },

        andThen<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
            if (maybe.kind === 'Just') {
                return fn(maybe.value);
            }
            return Nothing();
        }
    }
}

/**
 * Create a Just value, which represents a value that exists.
 * @param value the value to wrap in a Just.
 * @return a new Just value.
 * @example
 * ```ts
 * const maybeValue = Maybe.Just(42); // maybeValue is Just(42)
 * ```
*/
export function Just<T>(value: T): Maybe<T> {
    const v: Just<T> = { kind: 'Just', value };
    return Object.assign(v, MaybeOps(v));
}

/**
 * Create a Nothing value, which represents a value that does not exist.
 * @return a new Nothing value.
 * @example
 * ```ts
 * const maybeValue = Maybe.Nothing<number>(); // maybeValue is Nothing
 * ```
*/
export function Nothing<T>(): Maybe<T> {
    const v: Nothing = { kind: 'Nothing' };
    return Object.assign(v, MaybeOps<T>(v));
}

/**
 * Create a Maybe value from a value that may be null or undefined.
 * If the value is null or undefined, a Nothing value is returned.
 * Otherwise, a Just value is returned.
 * @param value the value to wrap in a Maybe.
 * @return a new Maybe value.
 * @example
 * ```ts
 * const maybeValue = Maybe.Maybe(42); // maybeValue is Just(42)
 * ...
 * const maybeValue = Maybe.Maybe(null); // maybeValue is Nothing
 * ```
*/
export function Maybe<T>(value: T | null | undefined): Maybe<T> {
    if (value === null || value === undefined) {
        return Nothing<T>();
    }
    return Just(value);
}