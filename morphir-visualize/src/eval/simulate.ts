import type { Type } from "../ir/types";
import type { FunctionEntry, IRIndex } from "../ir/index";
import { shapeOf } from "../data/shape";
import { toCamelCase } from "../ir/names";
import { EvalError, Evaluator, equal, type RV } from "./runtime";

/** Converts a test-data JSON value (see `data/shape.ts`) to a runtime value. */
export const toRuntime = (index: IRIndex, tpe: Type, data: unknown): RV => {
  const shape = shapeOf(index, tpe);
  switch (shape.kind) {
    case "bool":
      return data === true;
    case "int":
    case "float":
    case "decimal":
      return Number(data);
    case "string":
    case "char":
      return String(data ?? "");
    case "list":
      return { k: "list", v: (Array.isArray(data) ? data : []).map((d) => toRuntime(index, shape.item, d)) };
    case "maybe":
      return data === null || data === undefined ? { k: "ctor", n: "nothing", a: [] } : { k: "ctor", n: "just", a: [toRuntime(index, shape.item, data)] };
    case "tuple":
      return { k: "tuple", v: shape.elements.map((e, i) => toRuntime(index, e, (data as unknown[])?.[i])) };
    case "record": {
      const obj = (data ?? {}) as Record<string, unknown>;
      return { k: "rec", v: Object.fromEntries(shape.fields.map((f) => [toCamelCase(f.name), toRuntime(index, f.tpe, obj[toCamelCase(f.name)])])) };
    }
    case "custom": {
      const [name, ...args] = Array.isArray(data) ? data : [];
      const found = shape.constructors.find((c) => toCamelCase(c.name) === name);
      if (!found) throw new EvalError("Choose an option for every choice in the form.");
      return { k: "ctor", n: String(name), a: found.args.map((a, i) => toRuntime(index, a.tpe, args[i])) };
    }
    case "json":
      throw new EvalError("This kind of value cannot be simulated yet.");
  }
};

const spaced = (camel: string): string => {
  const text = camel.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Plain-language rendering of a runtime value. */
export const formatValue = (v: RV): string => {
  if (typeof v === "string") return `“${v}”`;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  switch (v.k) {
    case "unit":
      return "nothing";
    case "fn":
      return "a function";
    case "list":
      return v.v.length === 0 ? "an empty list" : `[${v.v.map(formatValue).join(", ")}]`;
    case "tuple":
      return `(${v.v.map(formatValue).join(", ")})`;
    case "rec":
      return `{ ${Object.entries(v.v).map(([k, x]) => `${spaced(k).toLowerCase()}: ${formatValue(x)}`).join(", ")} }`;
    case "ctor":
      return v.a.length === 0 ? spaced(v.n) : `${spaced(v.n)} (${v.a.map(formatValue).join(", ")})`;
  }
};

export type Simulation = {
  /** Ids of the logic nodes the evaluation passed through (empty when it failed early). */
  readonly visited: ReadonlySet<string>;
  readonly result?: RV;
  readonly text?: string;
  /** Why the simulation could not complete, in plain language. */
  readonly error?: string;
};

/** Runs a function on test-data inputs, recording the path taken through its logic. */
export const simulate = (index: IRIndex, entry: FunctionEntry, inputs: readonly unknown[]): Simulation => {
  const visited = new Set<string>();
  try {
    const rvs = entry.def.inputs.map(([, tpe], i) => toRuntime(index, tpe, inputs[i]));
    const result = new Evaluator(index).trace(entry.def, rvs, (id) => visited.add(id));
    return { visited, result, text: formatValue(result) };
  } catch (e) {
    if (e instanceof EvalError) return { visited, error: e.message };
    return { visited, error: "The simulator could not run this logic." };
  }
};

/** Whether the simulated result equals the expected output (undefined when it cannot be decided). */
export const matchesExpected = (index: IRIndex, entry: FunctionEntry, sim: Simulation, expected: unknown): boolean | undefined => {
  if (sim.result === undefined) return undefined;
  try {
    return equal(sim.result, toRuntime(index, entry.def.output, expected));
  } catch {
    return undefined;
  }
};
