type Just<T> = {
    readonly kind: 'Just';
    readonly value: T;
}

type Nothing = {
    readonly kind: 'Nothing';
}

interface MaybeOps<T> {
    getOrElse(defaultValue: T): T;
    map<U>(fn: (value: T) => U): Maybe<U>;
    flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
}

export type Maybe<T> = (Just<T> | Nothing) & MaybeOps<T>;

function MaybeOps<T>(maybe: Just<T> | Nothing): MaybeOps<T> {
    return {
        getOrElse(defaultValue: T): T {
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

        flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
            if (maybe.kind === 'Just') {
                return fn(maybe.value);
            }
            return Nothing();
        }
    }
}

export function Just<T>(value: T): Maybe<T> {
    const v: Just<T> = { kind: 'Just', value };
    return Object.assign(v, MaybeOps(v));
}

export function Nothing<T>(): Maybe<T> {
    const v: Nothing = { kind: 'Nothing' };
    return Object.assign(v, MaybeOps<T>(v));
}

export function Maybe<T>(value: T | null | undefined): Maybe<T> {
    if (value === null || value === undefined) {
        return Nothing<T>();
    }
    return Just(value);
}