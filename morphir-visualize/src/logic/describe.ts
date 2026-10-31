import type { FQName, Literal, Pattern, Type, Value } from "../ir/types";
import type { IRIndex } from "../ir/index";
import { isSdkReference } from "../ir/index";
import { humanize, humanizeInline, toCamelCase } from "../ir/names";

const sdkName = (fqn: FQName): string => `${fqn[1].map(toCamelCase).join(".")}.${toCamelCase(fqn[2])}`;

const comparisons: Readonly<Record<string, string>> = {
  "basics.equal": "is",
  "basics.notEqual": "is not",
  "basics.lessThan": "is less than",
  "basics.lessThanOrEqual": "is at most",
  "basics.greaterThan": "is greater than",
  "basics.greaterThanOrEqual": "is at least",
};

const arithmetic: Readonly<Record<string, string>> = {
  "basics.add": "+",
  "basics.subtract": "−",
  "basics.multiply": "×",
  "basics.divide": "÷",
  "basics.integerDivide": "÷",
  "basics.power": "to the power of",
  "string.append": "followed by",
  "list.append": "followed by",
};

const logic: Readonly<Record<string, string>> = { "basics.and": "and", "basics.or": "or" };

export const describeLiteral = (l: Literal): string => {
  switch (l.kind) {
    case "Bool":
      return l.value ? "Yes" : "No";
    case "String":
      return `“${l.value}”`;
    case "Char":
      return `‘${l.value}’`;
    default:
      return String(l.value);
  }
};

export const describePattern = (p: Pattern, nested = false): string => {
  switch (p.kind) {
    case "Wildcard":
      return nested ? "any value" : "anything else";
    case "As":
      return p.pattern.kind === "Wildcard" ? humanizeInline(p.name) : `${describePattern(p.pattern, true)} (called ${humanizeInline(p.name)})`;
    case "Tuple":
      return `(${p.elements.map((e) => describePattern(e, true)).join(", ")})`;
    case "Constructor": {
      const key = isSdkReference(p.fqn) ? sdkName(p.fqn) : "";
      if (key === "maybe.nothing") return "no value is present";
      if (key === "maybe.just") {
        const inner = p.args[0] && p.args[0].kind !== "Wildcard" ? describePattern(p.args[0], true) : "";
        return inner ? `a value is present (${inner})` : "a value is present";
      }
      const name = humanize(p.fqn[2]);
      if (p.args.every((a) => a.kind === "Wildcard")) return name;
      return `${name} with ${p.args.map((a) => describePattern(a, true)).join(", ")}`;
    }
    case "EmptyList":
      return "an empty list";
    case "HeadTail":
      return `a list starting with ${describePattern(p.head, true)}`;
    case "Literal":
      return describeLiteral(p.literal);
    case "Unit":
      return "nothing";
  }
};

const uncurry = (value: Value): { fn: Value; args: Value[] } => {
  const args: Value[] = [];
  let fn = value;
  while (fn.kind === "Apply") {
    args.unshift(fn.arg);
    fn = fn.fn;
  }
  return { fn, args };
};

/** Precedence levels: 0 = lowest (or), 1 = and, 2 = comparison, 3 = additive, 4 = multiplicative, 5 = atom. */
const paren = (text: string, own: number, outer: number): string => (own < outer ? `(${text})` : text);

/** Renders an expression as a short, plain-language phrase. */
export const describeValue = (value: Value, index?: IRIndex, outer = 0): string => {
  const d = (v: Value, prec = 0) => describeValue(v, index, prec);
  switch (value.kind) {
    case "Literal":
      return describeLiteral(value.literal);
    case "Unit":
      return "nothing";
    case "Variable":
      return humanizeInline(value.name);
    case "Constructor":
      return humanizeInline(value.fqn[2]);
    case "Reference":
      return humanizeInline(value.fqn[2]);
    case "Field":
      return `${humanizeInline(value.name)} of ${d(value.subject, 5)}`;
    case "FieldFunction":
      return `the ${humanizeInline(value.name)}`;
    case "Tuple":
      return `(${value.elements.map((e) => d(e)).join(", ")})`;
    case "List":
      return value.items.length === 0 ? "an empty list" : `a list of ${value.items.map((e) => d(e)).join(", ")}`;
    case "Record":
      return `{ ${value.fields.map(([n, v]) => `${humanizeInline(n)}: ${d(v)}`).join(", ")} }`;
    case "UpdateRecord":
      return `${d(value.subject, 5)} with ${value.fields.map(([n, v]) => `${humanizeInline(n)} = ${d(v)}`).join(", ")}`;
    case "Lambda":
      return `for each item: ${d(value.body)}`;
    case "IfThenElse":
      return paren(`if ${d(value.condition)} then ${d(value.then)} otherwise ${d(value.else)}`, 0, outer);
    case "PatternMatch":
      return `depends on ${d(value.subject)}`;
    case "LetDefinition":
      return d(value.body, outer);
    case "LetRecursion":
      return d(value.body, outer);
    case "Destructure":
      return d(value.body, outer);
    case "Apply": {
      const { fn, args } = uncurry(value);
      if (fn.kind === "Constructor") {
        const name = humanizeInline(fn.fqn[2]);
        if (name === "just" && args.length === 1) return d(args[0], outer);
        return `${name} (${args.map((a) => d(a)).join(", ")})`;
      }
      if (fn.kind === "Reference") {
        const name = isSdkReference(fn.fqn) ? sdkName(fn.fqn) : "";
        if (args.length === 2) {
          if (comparisons[name]) return paren(`${d(args[0], 3)} ${comparisons[name]} ${d(args[1], 3)}`, 2, outer);
          if (logic[name]) {
            const own = name === "basics.and" ? 1 : 0;
            return paren(`${d(args[0], own)} ${logic[name]} ${d(args[1], own)}`, own, outer);
          }
          if (arithmetic[name]) {
            const own = name === "basics.add" || name === "basics.subtract" ? 3 : 4;
            return paren(`${d(args[0], own)} ${arithmetic[name]} ${d(args[1], own + 1)}`, own, outer);
          }
        }
        if (name === "basics.not" && args.length === 1) return `not (${d(args[0])})`;
        if (name === "basics.negate" && args.length === 1) return `−${d(args[0], 5)}`;
        return `${humanizeInline(fn.fqn[2])} of ${args.map((a) => d(a, 5)).join(" and ")}`;
      }
      return `${d(fn, 5)} applied to ${args.map((a) => d(a, 5)).join(", ")}`;
    }
  }
};

export const describeType = (tpe: Type, index?: IRIndex): string => {
  switch (tpe.kind) {
    case "Unit":
      return "Nothing";
    case "Variable":
      return humanize(tpe.name);
    case "Tuple":
      return `Pair of (${tpe.elements.map((e) => describeType(e, index)).join(", ")})`;
    case "Record":
    case "ExtensibleRecord":
      return `Details (${tpe.fields.map((f) => humanizeInline(f.name)).join(", ")})`;
    case "Function":
      return "A calculation";
    case "Reference": {
      const key = `${sdkName(tpe.fqn)}`;
      const simple: Readonly<Record<string, string>> = {
        "basics.bool": "Yes / No",
        "basics.int": "Whole number",
        "basics.float": "Number",
        "string.string": "Text",
        "char.char": "Single character",
        "decimal.decimal": "Decimal number",
      };
      if (isSdkReference(tpe.fqn)) {
        if (simple[key]) return simple[key];
        if (key === "list.list") return `List of ${describeType(tpe.args[0], index)}`;
        if (key === "maybe.maybe") return `Optional ${describeType(tpe.args[0], index).toLowerCase()}`;
      }
      return humanize(tpe.fqn[2]);
    }
  }
};
