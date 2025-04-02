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
export function eq<A>(a: A, b: A): boolean {
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null && 'equals' in a && 'equals' in b) {
        return (a as any).equals(b) && (b as any).equals(a)
    } else {
        return a === b
    }
}

export function neq<A>(a: A, b: A): boolean {
    return a !== b
}

export function lt<A>(a: A, b: A): boolean {
    return a < b
}

export function lte<A>(a: A, b: A): boolean {
    return a <= b
}

export function gt<A>(a: A, b: A): boolean {
    return a > b
}

export function gte<A>(a: A, b: A): boolean {
    return a >= b
}
