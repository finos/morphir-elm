import type { FQName, Name, Package, Path, Type, TypeInfo, ValueDefinition, Value } from "./types";
import { fqnKey, humanize, humanizePath, nameKey, pathToString, toCamelCase } from "./names";
import { decodeDistribution } from "./decode";

export type FunctionEntry = {
  readonly key: string;
  readonly fqn: FQName;
  readonly modulePath: Path;
  readonly name: Name;
  readonly def: ValueDefinition;
  readonly doc: string;
};

export const isSdkReference = ([pkg]: FQName): boolean =>
  pkg.length === 2 && pkg[0].length === 1 && pkg[0][0] === "morphir" && pkg[1].join("") === "sdk";

/** Collects the fully-qualified references to other values used within an expression. */
export const referencedValues = (value: Value, into: FQName[] = []): FQName[] => {
  switch (value.kind) {
    case "Reference":
      into.push(value.fqn);
      break;
    case "Tuple":
      value.elements.forEach((v) => referencedValues(v, into));
      break;
    case "List":
      value.items.forEach((v) => referencedValues(v, into));
      break;
    case "Record":
    case "UpdateRecord":
      if (value.kind === "UpdateRecord") referencedValues(value.subject, into);
      value.fields.forEach(([, v]) => referencedValues(v, into));
      break;
    case "Field":
      referencedValues(value.subject, into);
      break;
    case "Apply":
      referencedValues(value.fn, into);
      referencedValues(value.arg, into);
      break;
    case "Lambda":
      referencedValues(value.body, into);
      break;
    case "LetDefinition":
      referencedValues(value.def.body, into);
      referencedValues(value.body, into);
      break;
    case "LetRecursion":
      value.defs.forEach(([, d]) => referencedValues(d.body, into));
      referencedValues(value.body, into);
      break;
    case "Destructure":
      referencedValues(value.value, into);
      referencedValues(value.body, into);
      break;
    case "IfThenElse":
      referencedValues(value.condition, into);
      referencedValues(value.then, into);
      referencedValues(value.else, into);
      break;
    case "PatternMatch":
      referencedValues(value.subject, into);
      value.cases.forEach(([, v]) => referencedValues(v, into));
      break;
    default:
      break;
  }
  return into;
};

/** Read-only lookup structure over a decoded package. */
export class IRIndex {
  readonly functions: readonly FunctionEntry[];
  private readonly byKey: ReadonlyMap<string, FunctionEntry>;
  private readonly types: ReadonlyMap<string, TypeInfo>;
  private readonly callers: ReadonlyMap<string, readonly string[]>;

  constructor(readonly pkg: Package) {
    const functions: FunctionEntry[] = [];
    const types = new Map<string, TypeInfo>(pkg.dependencyTypes);
    for (const m of pkg.modules) {
      for (const { name, def, doc } of m.values.values()) {
        const fqn: FQName = [pkg.path, m.path, name];
        functions.push({ key: fqnKey(fqn), fqn, modulePath: m.path, name, def, doc });
      }
      for (const { name, info } of m.types.values()) types.set(fqnKey([pkg.path, m.path, name]), info);
    }
    this.functions = functions;
    this.byKey = new Map(functions.map((f) => [f.key, f]));
    this.types = types;

    const callers = new Map<string, string[]>();
    for (const f of functions) {
      for (const ref of new Set(referencedValues(f.def.body).map(fqnKey))) {
        if (ref !== f.key && this.byKey.has(ref)) callers.set(ref, [...(callers.get(ref) ?? []), f.key]);
      }
    }
    this.callers = callers;
  }

  static fromJson(json: unknown): IRIndex {
    return new IRIndex(decodeDistribution(json));
  }

  getFunction(key: string): FunctionEntry | undefined {
    return this.byKey.get(key);
  }

  getFunctionByFQName(fqn: FQName): FunctionEntry | undefined {
    return this.byKey.get(fqnKey(fqn));
  }

  getType(fqn: FQName): TypeInfo | undefined {
    return this.types.get(fqnKey(fqn));
  }

  calledBy(key: string): readonly FunctionEntry[] {
    return (this.callers.get(key) ?? []).flatMap((k) => this.byKey.get(k) ?? []);
  }

  /** Functions grouped by module, in declaration order. */
  modules(): readonly { readonly path: Path; readonly label: string; readonly functions: readonly FunctionEntry[] }[] {
    return this.pkg.modules
      .map((m) => ({
        path: m.path,
        label: humanizePath(m.path),
        functions: this.functions.filter((f) => pathToString(f.modulePath) === pathToString(m.path)),
      }))
      .filter((m) => m.functions.length > 0);
  }

  functionLabel(f: FunctionEntry): string {
    return humanize(f.name);
  }

  functionId(f: FunctionEntry): string {
    return `${pathToString(f.modulePath)}.${toCamelCase(f.name)}:${nameKey(f.name)}`;
  }
}

export const resolveType = (index: IRIndex, tpe: Type): Type => {
  if (tpe.kind === "Reference") {
    const info = index.getType(tpe.fqn);
    if (info?.body.kind === "alias") {
      const substitution = new Map(info.params.map((p, i) => [nameKey(p), tpe.args[i]] as const));
      return resolveType(index, substitute(info.body.tpe, substitution));
    }
  }
  return tpe;
};

export const substitute = (tpe: Type, bindings: ReadonlyMap<string, Type | undefined>): Type => {
  switch (tpe.kind) {
    case "Variable":
      return bindings.get(nameKey(tpe.name)) ?? tpe;
    case "Reference":
      return { ...tpe, args: tpe.args.map((a) => substitute(a, bindings)) };
    case "Tuple":
      return { ...tpe, elements: tpe.elements.map((a) => substitute(a, bindings)) };
    case "Record":
    case "ExtensibleRecord":
      return { ...tpe, fields: tpe.fields.map((f) => ({ name: f.name, tpe: substitute(f.tpe, bindings) })) };
    case "Function":
      return { ...tpe, arg: substitute(tpe.arg, bindings), result: substitute(tpe.result, bindings) };
    default:
      return tpe;
  }
};
