import { dequal } from 'dequal'

// =========================================================
// If-Else
class ThenExprBuilder<A> {
    constructor(private condition: boolean, private previousExpr: [boolean, () => A][]) {}

    then(branch: () => A): WhenOtherwiseExprBuilder<A> {
        return new WhenOtherwiseExprBuilder<A>([...this.previousExpr, [this.condition, branch]])
    }
}

class WhenOtherwiseExprBuilder<A> {
    constructor(private previousExpr: [boolean, () => A][]) {}

    when(condition: boolean): ThenExprBuilder<A> {
        return new ThenExprBuilder<A>(condition, this.previousExpr)
    }

    else(branch: () => A): A {
        for (const [condition, thenBranch] of this.previousExpr) {
            if (condition) {
                return thenBranch()
            }
        }
        return branch()
    }
}

interface FirstThenExprBuilder {
    then<A>(branch: () => A): WhenOtherwiseExprBuilder<A>
}

export function when(boolExpr: boolean): FirstThenExprBuilder {
    return {
        then<A>(branch: () => A): WhenOtherwiseExprBuilder<A> {
            return new WhenOtherwiseExprBuilder<A>([[boolExpr, branch]])
        }
    }
}

// =========================================================
// Equality and Ordering

/**
 * Compares values of all types, including Function, RegExp, Date, Set, Map, null, undefined, and NaN values.
 * Complex values (eg, Objects, Arrays, Sets, Maps, etc) are traversed recursively.
 *
 * If both arguments contain an equals function then the function is used to compute equality between them.
 *
 * @param a The first value to compare.
 * @param b The second value to compare.
 * @returns A boolean indicating whether the two values are equal.
 */
export function eq<A>(a: A, b: A): boolean {
    if (
        typeof a === 'object' &&
        a !== null &&
        typeof b === 'object' &&
        b !== null &&
        'equals' in a &&
        typeof a['equals'] === 'function'
    ) {
        return (a as any).equals(b)
    } else {
        return dequal(a, b)
    }
}

/**
 * Compares values of all types, including Function, RegExp, Date, Set, Map, null, undefined, and NaN values.
 * Complex values (eg, Objects, Arrays, Sets, Maps, etc) are traversed recursively.
 *
 * If both arguments contain an equals function then the function is used to compute equality between them.
 *
 * @param a The first value to compare.
 * @param b The second value to compare.
 * @returns A boolean indicating whether the two values are equal.
 */
export function neq<A>(a: A, b: A): boolean {
    return !eq(a, b)
}
