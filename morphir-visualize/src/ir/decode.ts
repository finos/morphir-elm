import type {
  Constructors,
  Field,
  FQName,
  Literal,
  ModuleDefinition,
  Name,
  Package,
  Path,
  Pattern,
  Type,
  TypeInfo,
  Value,
  ValueDefinition,
} from "./types";
import { fqnKey, nameKey } from "./names";

type Obj = { readonly [key: string]: unknown };

const arr = (j: unknown): readonly unknown[] => {
  if (!Array.isArray(j)) throw new Error(`Invalid Morphir IR: expected an array but found ${JSON.stringify(j)?.slice(0, 80)}`);
  return j;
};

const obj = (j: unknown): Obj => {
  if (typeof j !== "object" || j === null || Array.isArray(j)) throw new Error("Invalid Morphir IR: expected an object");
  return j as Obj;
};

const str = (j: unknown): string => {
  if (typeof j !== "string") throw new Error("Invalid Morphir IR: expected a string");
  return j;
};

export const decodeName = (j: unknown): Name => arr(j).map(str);
export const decodePath = (j: unknown): Path => arr(j).map(decodeName);
export const decodeFQName = (j: unknown): FQName => {
  const a = arr(j);
  return [decodePath(a[0]), decodePath(a[1]), decodeName(a[2])];
};

const decodeDocumented = <T>(j: unknown, f: (v: unknown) => T): { doc: string; value: T } => {
  const o = obj(j);
  return { doc: typeof o.doc === "string" ? o.doc : "", value: f(o.value) };
};

const decodeField = (j: unknown): Field => {
  const o = obj(j);
  return { name: decodeName(o.name), tpe: decodeType(o.tpe) };
};

export const decodeType = (j: unknown): Type => {
  const a = arr(j);
  switch (str(a[0])) {
    case "Variable":
      return { kind: "Variable", name: decodeName(a[2]) };
    case "Reference":
      return { kind: "Reference", fqn: decodeFQName(a[2]), args: arr(a[3]).map(decodeType) };
    case "Tuple":
      return { kind: "Tuple", elements: arr(a[2]).map(decodeType) };
    case "Record":
      return { kind: "Record", fields: arr(a[2]).map(decodeField) };
    case "ExtensibleRecord":
      return { kind: "ExtensibleRecord", name: decodeName(a[2]), fields: arr(a[3]).map(decodeField) };
    case "Function":
      return { kind: "Function", arg: decodeType(a[2]), result: decodeType(a[3]) };
    case "Unit":
      return { kind: "Unit" };
    default:
      throw new Error(`Unknown type kind: ${String(a[0])}`);
  }
};

const decodeLiteral = (j: unknown): Literal => {
  const a = arr(j);
  switch (str(a[0])) {
    case "BoolLiteral":
      return { kind: "Bool", value: a[1] === true };
    case "CharLiteral":
      return { kind: "Char", value: str(a[1]) };
    case "StringLiteral":
      return { kind: "String", value: str(a[1]) };
    case "WholeNumberLiteral":
      return { kind: "WholeNumber", value: Number(a[1]) };
    case "FloatLiteral":
      return { kind: "Float", value: Number(a[1]) };
    case "DecimalLiteral":
      return { kind: "Decimal", value: String(a[1]) };
    default:
      throw new Error(`Unknown literal kind: ${String(a[0])}`);
  }
};

const decodePattern = (j: unknown): Pattern => {
  const a = arr(j);
  switch (str(a[0])) {
    case "WildcardPattern":
      return { kind: "Wildcard" };
    case "AsPattern":
      return { kind: "As", pattern: decodePattern(a[2]), name: decodeName(a[3]) };
    case "TuplePattern":
      return { kind: "Tuple", elements: arr(a[2]).map(decodePattern) };
    case "ConstructorPattern":
      return { kind: "Constructor", fqn: decodeFQName(a[2]), args: arr(a[3]).map(decodePattern) };
    case "EmptyListPattern":
      return { kind: "EmptyList" };
    case "HeadTailPattern":
      return { kind: "HeadTail", head: decodePattern(a[2]), tail: decodePattern(a[3]) };
    case "LiteralPattern":
      return { kind: "Literal", literal: decodeLiteral(a[2]) };
    case "UnitPattern":
      return { kind: "Unit" };
    default:
      throw new Error(`Unknown pattern kind: ${String(a[0])}`);
  }
};

const decodeNamedValues = (j: unknown): readonly (readonly [Name, Value])[] =>
  arr(j).map((e) => {
    const p = arr(e);
    return [decodeName(p[0]), decodeValue(p[1])] as const;
  });

export const decodeValue = (j: unknown): Value => {
  const a = arr(j);
  switch (str(a[0])) {
    case "Literal":
      return { kind: "Literal", literal: decodeLiteral(a[2]) };
    case "Constructor":
      return { kind: "Constructor", fqn: decodeFQName(a[2]) };
    case "Tuple":
      return { kind: "Tuple", elements: arr(a[2]).map(decodeValue) };
    case "List":
      return { kind: "List", items: arr(a[2]).map(decodeValue) };
    case "Record":
      return { kind: "Record", fields: decodeNamedValues(a[2]) };
    case "Variable":
      return { kind: "Variable", name: decodeName(a[2]) };
    case "Reference":
      return { kind: "Reference", fqn: decodeFQName(a[2]) };
    case "Field":
      return { kind: "Field", subject: decodeValue(a[2]), name: decodeName(a[3]) };
    case "FieldFunction":
      return { kind: "FieldFunction", name: decodeName(a[2]) };
    case "Apply":
      return { kind: "Apply", fn: decodeValue(a[2]), arg: decodeValue(a[3]) };
    case "Lambda":
      return { kind: "Lambda", pattern: decodePattern(a[2]), body: decodeValue(a[3]) };
    case "LetDefinition":
      return { kind: "LetDefinition", name: decodeName(a[2]), def: decodeValueDefinition(a[3]), body: decodeValue(a[4]) };
    case "LetRecursion":
      return {
        kind: "LetRecursion",
        defs: arr(a[2]).map((e) => {
          const p = arr(e);
          return [decodeName(p[0]), decodeValueDefinition(p[1])] as const;
        }),
        body: decodeValue(a[3]),
      };
    case "Destructure":
      return { kind: "Destructure", pattern: decodePattern(a[2]), value: decodeValue(a[3]), body: decodeValue(a[4]) };
    case "IfThenElse":
      return { kind: "IfThenElse", condition: decodeValue(a[2]), then: decodeValue(a[3]), else: decodeValue(a[4]) };
    case "PatternMatch":
      return {
        kind: "PatternMatch",
        subject: decodeValue(a[2]),
        cases: arr(a[3]).map((e) => {
          const p = arr(e);
          return [decodePattern(p[0]), decodeValue(p[1])] as const;
        }),
      };
    case "UpdateRecord":
      return { kind: "UpdateRecord", subject: decodeValue(a[2]), fields: decodeNamedValues(a[3]) };
    case "Unit":
      return { kind: "Unit" };
    default:
      throw new Error(`Unknown value kind: ${String(a[0])}`);
  }
};

export const decodeValueDefinition = (j: unknown): ValueDefinition => {
  const o = obj(j);
  return {
    inputs: arr(o.inputTypes).map((e) => {
      const p = arr(e);
      return [decodeName(p[0]), decodeType(p[2])] as const;
    }),
    output: decodeType(o.outputType),
    body: decodeValue(o.body),
  };
};

const decodeConstructors = (j: unknown): Constructors =>
  arr(j).map((e) => {
    const p = arr(e);
    return [
      decodeName(p[0]),
      arr(p[1]).map((arg) => {
        const q = arr(arg);
        return [decodeName(q[0]), decodeType(q[1])] as const;
      }),
    ] as const;
  });

const decodeTypeInfo = (j: unknown, doc: string, accessControlledConstructors: boolean): TypeInfo => {
  const a = arr(j);
  const params = arr(a[1]).map(decodeName);
  switch (str(a[0])) {
    case "TypeAliasDefinition":
    case "TypeAliasSpecification":
      return { params, doc, body: { kind: "alias", tpe: decodeType(a[2]) } };
    case "CustomTypeDefinition":
      return { params, doc, body: { kind: "custom", constructors: decodeConstructors(accessControlledConstructors ? obj(a[2]).value : a[2]) } };
    case "CustomTypeSpecification":
      return { params, doc, body: { kind: "custom", constructors: decodeConstructors(a[2]) } };
    case "DerivedTypeSpecification":
      return { params, doc, body: { kind: "derived", baseType: decodeType(obj(a[2]).baseType) } };
    default:
      return { params, doc, body: { kind: "opaque" } };
  }
};

const decodeModuleDefinition = (path: Path, j: unknown): ModuleDefinition => {
  const o = obj(j);
  const types = new Map<string, { name: Name; info: TypeInfo }>();
  for (const e of arr(o.types)) {
    const p = arr(e);
    const name = decodeName(p[0]);
    const documented = decodeDocumented(obj(p[1]).value, (v) => v);
    types.set(nameKey(name), { name, info: decodeTypeInfo(documented.value, documented.doc, true) });
  }
  const values = new Map<string, { name: Name; def: ValueDefinition; doc: string }>();
  for (const e of arr(o.values)) {
    const p = arr(e);
    const name = decodeName(p[0]);
    const documented = decodeDocumented(obj(p[1]).value, decodeValueDefinition);
    values.set(nameKey(name), { name, def: documented.value, doc: documented.doc });
  }
  return { path, types, values, doc: typeof o.doc === "string" ? o.doc : "" };
};

/** Decodes a `morphir-ir.json` document (format version 3, `Library` distribution). */
export const decodeDistribution = (json: unknown): Package => {
  const root = obj(json);
  if (root.formatVersion !== 3) {
    throw new Error(`Unsupported Morphir IR format version ${String(root.formatVersion)}; expected 3. Re-run "morphir-elm make".`);
  }
  const dist = arr(root.distribution);
  if (str(dist[0]) !== "Library") throw new Error(`Unsupported distribution kind: ${String(dist[0])}`);
  const packagePath = decodePath(dist[1]);

  const dependencyTypes = new Map<string, TypeInfo>();
  for (const dep of arr(dist[2])) {
    const d = arr(dep);
    const depPath = decodePath(d[0]);
    for (const m of arr(obj(d[1]).modules)) {
      const mp = arr(m);
      const modulePath = decodePath(mp[0]);
      for (const t of arr(obj(mp[1]).types)) {
        const tp = arr(t);
        const documented = decodeDocumented(tp[1], (v) => v);
        dependencyTypes.set(fqnKey([depPath, modulePath, decodeName(tp[0])]), decodeTypeInfo(documented.value, documented.doc, false));
      }
    }
  }

  const modules = arr(obj(dist[3]).modules).map((m) => {
    const mp = arr(m);
    return decodeModuleDefinition(decodePath(mp[0]), obj(mp[1]).value);
  });
  return { path: packagePath, modules, dependencyTypes };
};
