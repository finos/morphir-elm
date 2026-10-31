import type { FQName, Literal, Pattern, Value, ValueDefinition } from "../ir/types";
import type { IRIndex } from "../ir/index";
import { isSdkReference } from "../ir/index";
import { nameKey, toCamelCase } from "../ir/names";

/** Runtime values of the simulator. Records are keyed by camelCase field name, constructors by camelCase name. */
export type RV =
  | number
  | string
  | boolean
  | { readonly k: "list"; readonly v: readonly RV[] }
  | { readonly k: "tuple"; readonly v: readonly RV[] }
  | { readonly k: "rec"; readonly v: Readonly<Record<string, RV>> }
  | { readonly k: "ctor"; readonly n: string; readonly a: readonly RV[] }
  | { readonly k: "unit" }
  | { readonly k: "fn"; readonly arity: number; readonly call: (args: readonly RV[]) => RV };

/** Raised for logic the simulator cannot evaluate; the message is safe to show to users. */
export class EvalError extends Error {}

type Env = ReadonlyMap<string, RV>;

const list = (v: readonly RV[]): RV => ({ k: "list", v });
const ctor = (n: string, a: readonly RV[] = []): RV => ({ k: "ctor", n, a });
const nothing: RV = ctor("nothing");
const just = (x: RV): RV => ctor("just", [x]);
const unit: RV = { k: "unit" };

export const equal = (a: RV, b: RV): boolean => {
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  if (a.k !== b.k) return false;
  switch (a.k) {
    case "list":
    case "tuple":
      return a.v.length === (b as typeof a).v.length && a.v.every((x, i) => equal(x, (b as typeof a).v[i]));
    case "rec": {
      const o = (b as typeof a).v;
      const keys = Object.keys(a.v);
      return keys.length === Object.keys(o).length && keys.every((k) => k in o && equal(a.v[k], o[k]));
    }
    case "ctor":
      return a.n === (b as typeof a).n && a.a.length === (b as typeof a).a.length && a.a.every((x, i) => equal(x, (b as typeof a).a[i]));
    case "unit":
      return true;
    case "fn":
      return false;
  }
};

const compare = (a: RV, b: RV): number => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  if (typeof a === "object" && typeof b === "object" && (a.k === "list" || a.k === "tuple") && a.k === b.k) {
    const bv = (b as typeof a).v;
    for (let i = 0; i < Math.min(a.v.length, bv.length); i++) {
      const c = compare(a.v[i], bv[i]);
      if (c !== 0) return c;
    }
    return a.v.length - bv.length;
  }
  throw new EvalError("These values cannot be compared.");
};

const num = (v: RV): number => {
  if (typeof v === "number") return v;
  throw new EvalError("Expected a number.");
};
const str = (v: RV): string => {
  if (typeof v === "string") return v;
  throw new EvalError("Expected text.");
};
const bool = (v: RV): boolean => {
  if (typeof v === "boolean") return v;
  throw new EvalError("Expected a yes/no value.");
};
const items = (v: RV): readonly RV[] => {
  if (typeof v === "object" && v.k === "list") return v.v;
  throw new EvalError("Expected a list.");
};

const applyAll = (f: RV, args: readonly RV[]): RV => {
  if (typeof f !== "object" || f.k !== "fn") throw new EvalError("Tried to apply something that is not a function.");
  if (args.length < f.arity) {
    const inner = f;
    return { k: "fn", arity: f.arity - args.length, call: (rest) => inner.call([...args, ...rest]) };
  }
  const result = f.call(args.slice(0, f.arity));
  return args.length > f.arity ? applyAll(result, args.slice(f.arity)) : result;
};

const fn = (v: RV): ((args: readonly RV[]) => RV) => {
  if (typeof v === "object" && v.k === "fn") return (args) => applyAll(v, args);
  throw new EvalError("Expected a function.");
};
const isCtor = (v: RV, name: string): v is Extract<RV, { k: "ctor" }> => typeof v === "object" && v.k === "ctor" && v.n === name;

const native = (arity: number, call: (args: readonly RV[]) => RV): RV => ({ k: "fn", arity, call });

const natives: Readonly<Record<string, RV>> = {
  "basics.add": native(2, ([a, b]) => num(a) + num(b)),
  "basics.subtract": native(2, ([a, b]) => num(a) - num(b)),
  "basics.multiply": native(2, ([a, b]) => num(a) * num(b)),
  "basics.divide": native(2, ([a, b]) => num(a) / num(b)),
  "basics.integerDivide": native(2, ([a, b]) => (num(b) === 0 ? 0 : Math.trunc(num(a) / num(b)))),
  "basics.power": native(2, ([a, b]) => Math.pow(num(a), num(b))),
  "basics.modBy": native(2, ([m, x]) => (num(m) === 0 ? 0 : ((num(x) % num(m)) + num(m)) % num(m))),
  "basics.remainderBy": native(2, ([m, x]) => (num(m) === 0 ? 0 : num(x) % num(m))),
  "basics.negate": native(1, ([a]) => -num(a)),
  "basics.abs": native(1, ([a]) => Math.abs(num(a))),
  "basics.sqrt": native(1, ([a]) => Math.sqrt(num(a))),
  "basics.min": native(2, ([a, b]) => (compare(a, b) <= 0 ? a : b)),
  "basics.max": native(2, ([a, b]) => (compare(a, b) >= 0 ? a : b)),
  "basics.clamp": native(3, ([lo, hi, x]) => (compare(x, lo) < 0 ? lo : compare(x, hi) > 0 ? hi : x)),
  "basics.toFloat": native(1, ([a]) => num(a)),
  "basics.round": native(1, ([a]) => Math.round(num(a))),
  "basics.floor": native(1, ([a]) => Math.floor(num(a))),
  "basics.ceiling": native(1, ([a]) => Math.ceil(num(a))),
  "basics.truncate": native(1, ([a]) => Math.trunc(num(a))),
  "basics.equal": native(2, ([a, b]) => equal(a, b)),
  "basics.notEqual": native(2, ([a, b]) => !equal(a, b)),
  "basics.lessThan": native(2, ([a, b]) => compare(a, b) < 0),
  "basics.greaterThan": native(2, ([a, b]) => compare(a, b) > 0),
  "basics.lessThanOrEqual": native(2, ([a, b]) => compare(a, b) <= 0),
  "basics.greaterThanOrEqual": native(2, ([a, b]) => compare(a, b) >= 0),
  "basics.and": native(2, ([a, b]) => bool(a) && bool(b)),
  "basics.or": native(2, ([a, b]) => bool(a) || bool(b)),
  "basics.xor": native(2, ([a, b]) => bool(a) !== bool(b)),
  "basics.not": native(1, ([a]) => !bool(a)),
  "basics.always": native(2, ([a]) => a),
  "basics.identity": native(1, ([a]) => a),
  "basics.append": native(2, ([a, b]) => (typeof a === "string" ? a + str(b) : list([...items(a), ...items(b)]))),
  "basics.composeRight": native(3, ([f, g, x]) => fn(g)([fn(f)([x])])),
  "basics.composeLeft": native(3, ([g, f, x]) => fn(g)([fn(f)([x])])),

  "maybe.withDefault": native(2, ([d, m]) => (isCtor(m, "just") ? m.a[0] : d)),
  "maybe.map": native(2, ([f, m]) => (isCtor(m, "just") ? just(fn(f)([m.a[0]])) : nothing)),
  "maybe.andThen": native(2, ([f, m]) => (isCtor(m, "just") ? fn(f)([m.a[0]]) : nothing)),

  "result.withDefault": native(2, ([d, r]) => (isCtor(r, "ok") ? r.a[0] : d)),
  "result.map": native(2, ([f, r]) => (isCtor(r, "ok") ? ctor("ok", [fn(f)([r.a[0]])]) : r)),

  "string.length": native(1, ([s]) => str(s).length),
  "string.isEmpty": native(1, ([s]) => str(s).length === 0),
  "string.toUpper": native(1, ([s]) => str(s).toUpperCase()),
  "string.toLower": native(1, ([s]) => str(s).toLowerCase()),
  "string.trim": native(1, ([s]) => str(s).trim()),
  "string.reverse": native(1, ([s]) => [...str(s)].reverse().join("")),
  "string.contains": native(2, ([sub, s]) => str(s).includes(str(sub))),
  "string.startsWith": native(2, ([p, s]) => str(s).startsWith(str(p))),
  "string.endsWith": native(2, ([p, s]) => str(s).endsWith(str(p))),
  "string.append": native(2, ([a, b]) => str(a) + str(b)),
  "string.concat": native(1, ([l]) => items(l).map(str).join("")),
  "string.join": native(2, ([sep, l]) => items(l).map(str).join(str(sep))),
  "string.left": native(2, ([n, s]) => str(s).slice(0, Math.max(0, num(n)))),
  "string.right": native(2, ([n, s]) => (num(n) <= 0 ? "" : str(s).slice(-num(n)))),
  "string.fromInt": native(1, ([n]) => String(num(n))),
  "string.fromFloat": native(1, ([n]) => String(num(n))),
  "string.toInt": native(1, ([s]) => (/^-?\d+$/.test(str(s)) ? just(Number(s)) : nothing)),
  "string.toFloat": native(1, ([s]) => (str(s).trim() !== "" && !Number.isNaN(Number(s)) ? just(Number(s)) : nothing)),

  "list.length": native(1, ([l]) => items(l).length),
  "list.isEmpty": native(1, ([l]) => items(l).length === 0),
  "list.sum": native(1, ([l]) => items(l).reduce<number>((a, x) => a + num(x), 0)),
  "list.product": native(1, ([l]) => items(l).reduce<number>((a, x) => a * num(x), 1)),
  "list.maximum": native(1, ([l]) => (items(l).length === 0 ? nothing : just(items(l).reduce((a, x) => (compare(x, a) > 0 ? x : a))))),
  "list.minimum": native(1, ([l]) => (items(l).length === 0 ? nothing : just(items(l).reduce((a, x) => (compare(x, a) < 0 ? x : a))))),
  "list.map": native(2, ([f, l]) => list(items(l).map((x) => fn(f)([x])))),
  "list.indexedMap": native(2, ([f, l]) => list(items(l).map((x, i) => fn(f)([i, x])))),
  "list.filter": native(2, ([f, l]) => list(items(l).filter((x) => bool(fn(f)([x]))))),
  "list.filterMap": native(2, ([f, l]) =>
    list(
      items(l).flatMap((x) => {
        const r = fn(f)([x]);
        return isCtor(r, "just") ? [r.a[0]] : [];
      }),
    ),
  ),
  "list.concatMap": native(2, ([f, l]) => list(items(l).flatMap((x) => items(fn(f)([x]))))),
  "list.concat": native(1, ([l]) => list(items(l).flatMap(items))),
  "list.append": native(2, ([a, b]) => list([...items(a), ...items(b)])),
  "list.cons": native(2, ([x, l]) => list([x, ...items(l)])),
  "list.singleton": native(1, ([x]) => list([x])),
  "list.reverse": native(1, ([l]) => list([...items(l)].reverse())),
  "list.member": native(2, ([x, l]) => items(l).some((y) => equal(x, y))),
  "list.any": native(2, ([f, l]) => items(l).some((x) => bool(fn(f)([x])))),
  "list.all": native(2, ([f, l]) => items(l).every((x) => bool(fn(f)([x])))),
  "list.head": native(1, ([l]) => (items(l).length > 0 ? just(items(l)[0]) : nothing)),
  "list.tail": native(1, ([l]) => (items(l).length > 0 ? just(list(items(l).slice(1))) : nothing)),
  "list.take": native(2, ([n, l]) => list(items(l).slice(0, Math.max(0, num(n))))),
  "list.drop": native(2, ([n, l]) => list(items(l).slice(Math.max(0, num(n))))),
  "list.range": native(2, ([a, b]) => list(Array.from({ length: Math.max(0, num(b) - num(a) + 1) }, (_, i) => num(a) + i))),
  "list.repeat": native(2, ([n, x]) => list(Array.from({ length: Math.max(0, num(n)) }, () => x))),
  "list.sort": native(1, ([l]) => list([...items(l)].sort(compare))),
  "list.sortBy": native(2, ([f, l]) => list([...items(l)].sort((a, b) => compare(fn(f)([a]), fn(f)([b]))))),
  "list.foldl": native(3, ([f, z, l]) => items(l).reduce((acc, x) => fn(f)([x, acc]), z)),
  "list.foldr": native(3, ([f, z, l]) => [...items(l)].reverse().reduce((acc, x) => fn(f)([x, acc]), z)),
};

const literal = (l: Literal): RV => (l.kind === "Decimal" ? Number(l.value) : l.value);

/** Binds the variables of `pattern` when `value` matches; returns undefined otherwise. */
const matchPattern = (pattern: Pattern, value: RV, env: Env): Env | undefined => {
  switch (pattern.kind) {
    case "Wildcard":
    case "Unit":
      return env;
    case "As": {
      const inner = matchPattern(pattern.pattern, value, env);
      return inner && new Map(inner).set(nameKey(pattern.name), value);
    }
    case "Literal":
      return equal(literal(pattern.literal), value) ? env : undefined;
    case "EmptyList":
      return typeof value === "object" && value.k === "list" && value.v.length === 0 ? env : undefined;
    case "HeadTail": {
      if (typeof value !== "object" || value.k !== "list" || value.v.length === 0) return undefined;
      const head = matchPattern(pattern.head, value.v[0], env);
      return head && matchPattern(pattern.tail, list(value.v.slice(1)), head);
    }
    case "Tuple": {
      if (typeof value !== "object" || value.k !== "tuple" || value.v.length !== pattern.elements.length) return undefined;
      const parts = value.v;
      return pattern.elements.reduce<Env | undefined>((e, p, i) => e && matchPattern(p, parts[i], e), env);
    }
    case "Constructor": {
      if (typeof value !== "object" || value.k !== "ctor" || value.n !== toCamelCase(pattern.fqn[2]) || value.a.length !== pattern.args.length) return undefined;
      const args = value.a;
      return pattern.args.reduce<Env | undefined>((e, p, i) => e && matchPattern(p, args[i], e), env);
    }
  }
};

const MAX_CALLS = 20000;

const mustMatch = (pattern: Pattern, value: RV, env: Env): Env => {
  const bound = matchPattern(pattern, value, env);
  if (!bound) throw new EvalError("A value did not have the expected shape.");
  return bound;
};

/**
 * Evaluates IR values. Unsupported constructs raise {@link EvalError}. `trace` additionally reports,
 * via `visit`, the ids of the logic-tree nodes (see `buildLogic`) that the evaluation passes through.
 */
export class Evaluator {
  private calls = 0;

  constructor(private readonly index: IRIndex) {}

  private reference(fqn: FQName): RV {
    if (isSdkReference(fqn)) {
      const key = `${fqn[1].map(toCamelCase).join(".")}.${toCamelCase(fqn[2])}`;
      const found = natives[key];
      if (!found) throw new EvalError(`The simulator does not support “${key}” yet.`);
      return found;
    }
    const entry = this.index.getFunctionByFQName(fqn);
    if (!entry) throw new EvalError(`Could not find ${toCamelCase(fqn[2])}.`);
    return this.closure(entry.def, new Map());
  }

  private closure(def: ValueDefinition, env: Env): RV {
    if (def.inputs.length === 0) return this.eval(def.body, env);
    return native(def.inputs.length, (args) => {
      if (++this.calls > MAX_CALLS) throw new EvalError("This logic runs for too long to simulate.");
      const local = new Map(env);
      def.inputs.forEach(([name], i) => local.set(nameKey(name), args[i]));
      return this.eval(def.body, local);
    });
  }

  private bind(def: ValueDefinition, inputs: readonly RV[]): Map<string, RV> {
    this.calls = 0;
    const env = new Map<string, RV>();
    def.inputs.forEach(([name], i) => env.set(nameKey(name), inputs[i]));
    return env;
  }

  run(def: ValueDefinition, inputs: readonly RV[]): RV {
    return this.eval(def.body, this.bind(def, inputs));
  }

  trace(def: ValueDefinition, inputs: readonly RV[], visit: (id: string) => void): RV {
    return this.walk(def.body, "root", this.bind(def, inputs), visit);
  }

  private walk(value: Value, id: string, env: Env, visit: (id: string) => void): RV {
    visit(id);
    switch (value.kind) {
      case "IfThenElse": {
        let current: Value = value;
        let n = 0;
        while (current.kind === "IfThenElse") {
          if (bool(this.eval(current.condition, env))) return this.walk(current.then, `${id}.rule${n}`, env, visit);
          n++;
          current = current.else;
        }
        return this.walk(current, `${id}.otherwise`, env, visit);
      }
      case "PatternMatch": {
        const subject = this.eval(value.subject, env);
        for (let i = 0; i < value.cases.length; i++) {
          const bound = matchPattern(value.cases[i][0], subject, env);
          if (bound) return this.walk(value.cases[i][1], `${id}.case${i}`, bound, visit);
        }
        throw new EvalError("None of the cases applies to these values.");
      }
      case "LetDefinition":
      case "LetRecursion":
      case "Destructure": {
        let scope: Env = env;
        let current: Value = value;
        let n = 0;
        while (current.kind === "LetDefinition" || current.kind === "LetRecursion" || current.kind === "Destructure") {
          const next = new Map(scope);
          if (current.kind === "LetDefinition") {
            const stepId = `${id}.step${n++}`;
            if (current.def.inputs.length === 0) next.set(nameKey(current.name), this.walk(current.def.body, stepId, scope, visit));
            else {
              visit(stepId);
              next.set(nameKey(current.name), this.closure(current.def, next));
            }
            scope = next;
          } else if (current.kind === "LetRecursion") {
            for (const [name, d] of current.defs) {
              visit(`${id}.step${n++}`);
              next.set(nameKey(name), this.closure(d, next));
            }
            scope = next;
          } else {
            const stepId = `${id}.step${n++}`;
            scope = mustMatch(current.pattern, this.walk(current.value, stepId, scope, visit), scope);
          }
          current = current.body;
        }
        return this.walk(current, `${id}.result`, scope, visit);
      }
      default:
        return this.eval(value, env);
    }
  }

  eval(value: Value, env: Env): RV {
    switch (value.kind) {
      case "Literal":
        return literal(value.literal);
      case "Unit":
        return unit;
      case "Constructor":
        return ctor(toCamelCase(value.fqn[2]));
      case "Tuple":
        return { k: "tuple", v: value.elements.map((e) => this.eval(e, env)) };
      case "List":
        return list(value.items.map((e) => this.eval(e, env)));
      case "Record":
        return { k: "rec", v: Object.fromEntries(value.fields.map(([n, v]) => [toCamelCase(n), this.eval(v, env)])) };
      case "Variable": {
        const found = env.get(nameKey(value.name));
        if (found === undefined) throw new EvalError(`Unknown value “${nameKey(value.name)}”.`);
        return found;
      }
      case "Reference":
        return this.reference(value.fqn);
      case "Field": {
        const subject = this.eval(value.subject, env);
        if (typeof subject === "object" && subject.k === "rec") return subject.v[toCamelCase(value.name)];
        throw new EvalError("Expected a record.");
      }
      case "FieldFunction": {
        const name = toCamelCase(value.name);
        return native(1, ([r]) => {
          if (typeof r === "object" && r.k === "rec") return r.v[name];
          throw new EvalError("Expected a record.");
        });
      }
      case "Apply": {
        const args: Value[] = [];
        let head: Value = value;
        while (head.kind === "Apply") {
          args.unshift(head.arg);
          head = head.fn;
        }
        const values = args.map((a) => this.eval(a, env));
        if (head.kind === "Constructor") return ctor(toCamelCase(head.fqn[2]), values);
        return applyAll(this.eval(head, env), values);
      }
      case "Lambda":
        return native(1, ([arg]) => this.eval(value.body, mustMatch(value.pattern, arg, env)));
      case "LetDefinition": {
        const next = new Map(env);
        next.set(nameKey(value.name), this.closure(value.def, next));
        return this.eval(value.body, next);
      }
      case "LetRecursion": {
        const next = new Map(env);
        for (const [name, d] of value.defs) next.set(nameKey(name), this.closure(d, next));
        return this.eval(value.body, next);
      }
      case "Destructure":
        return this.eval(value.body, mustMatch(value.pattern, this.eval(value.value, env), env));
      case "IfThenElse":
        return this.eval(bool(this.eval(value.condition, env)) ? value.then : value.else, env);
      case "PatternMatch": {
        const subject = this.eval(value.subject, env);
        for (const [pattern, body] of value.cases) {
          const bound = matchPattern(pattern, subject, env);
          if (bound) return this.eval(body, bound);
        }
        throw new EvalError("None of the cases applies to these values.");
      }
      case "UpdateRecord": {
        const subject = this.eval(value.subject, env);
        if (typeof subject !== "object" || subject.k !== "rec") throw new EvalError("Expected a record.");
        return { k: "rec", v: { ...subject.v, ...Object.fromEntries(value.fields.map(([n, v]) => [toCamelCase(n), this.eval(v, env)])) } };
      }
    }
  }
}
