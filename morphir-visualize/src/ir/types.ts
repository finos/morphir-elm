/** Minimal, immutable model of the Morphir IR (format version 3) used by the visualizer. */

export type Name = readonly string[];
export type Path = readonly Name[];
export type FQName = readonly [Path, Path, Name];

export type Field = { readonly name: Name; readonly tpe: Type };

export type Type =
  | { readonly kind: "Variable"; readonly name: Name }
  | { readonly kind: "Reference"; readonly fqn: FQName; readonly args: readonly Type[] }
  | { readonly kind: "Tuple"; readonly elements: readonly Type[] }
  | { readonly kind: "Record"; readonly fields: readonly Field[] }
  | { readonly kind: "ExtensibleRecord"; readonly name: Name; readonly fields: readonly Field[] }
  | { readonly kind: "Function"; readonly arg: Type; readonly result: Type }
  | { readonly kind: "Unit" };

export type Literal =
  | { readonly kind: "Bool"; readonly value: boolean }
  | { readonly kind: "Char"; readonly value: string }
  | { readonly kind: "String"; readonly value: string }
  | { readonly kind: "WholeNumber"; readonly value: number }
  | { readonly kind: "Float"; readonly value: number }
  | { readonly kind: "Decimal"; readonly value: string };

export type Pattern =
  | { readonly kind: "Wildcard" }
  | { readonly kind: "As"; readonly pattern: Pattern; readonly name: Name }
  | { readonly kind: "Tuple"; readonly elements: readonly Pattern[] }
  | { readonly kind: "Constructor"; readonly fqn: FQName; readonly args: readonly Pattern[] }
  | { readonly kind: "EmptyList" }
  | { readonly kind: "HeadTail"; readonly head: Pattern; readonly tail: Pattern }
  | { readonly kind: "Literal"; readonly literal: Literal }
  | { readonly kind: "Unit" };

export type ValueDefinition = {
  readonly inputs: readonly (readonly [Name, Type])[];
  readonly output: Type;
  readonly body: Value;
};

export type Value =
  | { readonly kind: "Literal"; readonly literal: Literal }
  | { readonly kind: "Constructor"; readonly fqn: FQName }
  | { readonly kind: "Tuple"; readonly elements: readonly Value[] }
  | { readonly kind: "List"; readonly items: readonly Value[] }
  | { readonly kind: "Record"; readonly fields: readonly (readonly [Name, Value])[] }
  | { readonly kind: "Variable"; readonly name: Name }
  | { readonly kind: "Reference"; readonly fqn: FQName }
  | { readonly kind: "Field"; readonly subject: Value; readonly name: Name }
  | { readonly kind: "FieldFunction"; readonly name: Name }
  | { readonly kind: "Apply"; readonly fn: Value; readonly arg: Value }
  | { readonly kind: "Lambda"; readonly pattern: Pattern; readonly body: Value }
  | { readonly kind: "LetDefinition"; readonly name: Name; readonly def: ValueDefinition; readonly body: Value }
  | { readonly kind: "LetRecursion"; readonly defs: readonly (readonly [Name, ValueDefinition])[]; readonly body: Value }
  | { readonly kind: "Destructure"; readonly pattern: Pattern; readonly value: Value; readonly body: Value }
  | { readonly kind: "IfThenElse"; readonly condition: Value; readonly then: Value; readonly else: Value }
  | { readonly kind: "PatternMatch"; readonly subject: Value; readonly cases: readonly (readonly [Pattern, Value])[] }
  | { readonly kind: "UpdateRecord"; readonly subject: Value; readonly fields: readonly (readonly [Name, Value])[] }
  | { readonly kind: "Unit" };

export type Constructors = readonly (readonly [Name, readonly (readonly [Name, Type])[]])[];

export type TypeBody =
  | { readonly kind: "alias"; readonly tpe: Type }
  | { readonly kind: "custom"; readonly constructors: Constructors }
  | { readonly kind: "opaque" }
  | { readonly kind: "derived"; readonly baseType: Type };

export type TypeInfo = {
  readonly params: readonly Name[];
  readonly body: TypeBody;
  readonly doc: string;
};

export type ModuleDefinition = {
  readonly path: Path;
  readonly types: ReadonlyMap<string, { readonly name: Name; readonly info: TypeInfo }>;
  readonly values: ReadonlyMap<string, { readonly name: Name; readonly def: ValueDefinition; readonly doc: string }>;
  readonly doc: string;
};

export type Package = {
  readonly path: Path;
  readonly modules: readonly ModuleDefinition[];
  readonly dependencyTypes: ReadonlyMap<string, TypeInfo>;
};
