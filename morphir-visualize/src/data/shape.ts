import type { Field, Name, Type } from "../ir/types";
import type { IRIndex } from "../ir/index";
import { isSdkReference, resolveType, substitute } from "../ir/index";
import { nameKey, toCamelCase } from "../ir/names";

/**
 * How a value of some type is entered and serialised in `morphir-tests.json`
 * (mirrors `Morphir.IR.Type.DataCodec`).
 */
export type Shape =
  | { readonly kind: "bool" | "int" | "float" | "string" | "char" | "decimal" }
  | { readonly kind: "list"; readonly item: Type }
  | { readonly kind: "maybe"; readonly item: Type }
  | { readonly kind: "record"; readonly fields: readonly Field[] }
  | { readonly kind: "tuple"; readonly elements: readonly Type[] }
  | { readonly kind: "custom"; readonly constructors: readonly { readonly name: Name; readonly args: readonly Field[] }[] }
  | { readonly kind: "json" };

const sdk: Readonly<Record<string, Shape["kind"]>> = {
  "basics.bool": "bool",
  "basics.int": "int",
  "basics.float": "float",
  "string.string": "string",
  "char.char": "char",
  "decimal.decimal": "decimal",
};

export const shapeOf = (index: IRIndex, tpe: Type): Shape => {
  const t = resolveType(index, tpe);
  switch (t.kind) {
    case "Record":
      return { kind: "record", fields: t.fields };
    case "Tuple":
      return { kind: "tuple", elements: t.elements };
    case "Reference": {
      if (isSdkReference(t.fqn)) {
        const key = `${t.fqn[1].map(toCamelCase).join(".")}.${toCamelCase(t.fqn[2])}`;
        if (sdk[key] && t.args.length === 0) return { kind: sdk[key] } as Shape;
        if (key === "list.list" && t.args.length === 1) return { kind: "list", item: t.args[0] };
        if (key === "maybe.maybe" && t.args.length === 1) return { kind: "maybe", item: t.args[0] };
        return { kind: "json" };
      }
      const info = index.getType(t.fqn);
      if (info?.body.kind === "custom") {
        const bindings = new Map(info.params.map((p, i) => [nameKey(p), t.args[i]] as const));
        return {
          kind: "custom",
          constructors: info.body.constructors.map(([name, args]) => ({
            name,
            args: args.map(([argName, argType]) => ({ name: argName, tpe: substitute(argType, bindings) })),
          })),
        };
      }
      if (info?.body.kind === "derived") return shapeOf(index, info.body.baseType);
      return { kind: "json" };
    }
    default:
      return { kind: "json" };
  }
};

const MAX_DEPTH = 6;

/** A valid starting value for a type, in the test-data JSON format. */
export const defaultData = (index: IRIndex, tpe: Type, depth = 0): unknown => {
  const shape = shapeOf(index, tpe);
  switch (shape.kind) {
    case "bool":
      return false;
    case "int":
    case "float":
      return 0;
    case "string":
    case "char":
    case "decimal":
      return shape.kind === "decimal" ? "0" : "";
    case "list":
      return [];
    case "maybe":
      return null;
    case "tuple":
      return shape.elements.map((e) => defaultData(index, e, depth + 1));
    case "record":
      return Object.fromEntries(shape.fields.map((f) => [toCamelCase(f.name), defaultData(index, f.tpe, depth + 1)]));
    case "custom": {
      const simplest = [...shape.constructors].sort((a, b) => a.args.length - b.args.length)[0];
      if (!simplest) return null;
      const args = depth >= MAX_DEPTH ? [] : simplest.args.map((a) => defaultData(index, a.tpe, depth + 1));
      return [toCamelCase(simplest.name), ...args];
    }
    case "json":
      return null;
  }
};
