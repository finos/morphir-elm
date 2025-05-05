import { dequal } from "dequal";


/**
 * Compares values of all types, including Function, RegExp, Date, Set, Map, TypedArrays, DataView, null, undefined, and NaN values. 
 * Complex values (eg, Objects, Arrays, Sets, Maps, etc) are traversed recursively.
 * @param a The first value to compare.
 * @param b The second value to compare.
 * @returns A boolean indicating whether the two values are equal.
 */
export function equal<A>(a: A, b: A): boolean {
  return dequal(a, b);
}