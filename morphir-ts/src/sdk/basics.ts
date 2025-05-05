import { dequal } from "dequal";

export function equal<A>(a: A, b: A): boolean {
  return dequal(a, b);
}