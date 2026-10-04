# Morphir Elm

## Purpose

`finos/morphir-elm` generates Elm source from current Morphir IR. The package `finos/morphir-elm/backend` lowers
IR to the [elm-syntax](https://package.elm-lang.org/packages/stil4m/elm-syntax/7.3.9/) AST of
[moonrockz/krueger](https://github.com/moonrockz/krueger) and prints it in the elm-format layout.

The backend has no engine, host, filesystem, process or network imports. It takes an `IRFile` and options, and it
returns the generated files as text. The same input and options give the same output bytes. The engine registers
the backend as the generation backend `elm`.

## Use from the engine

Set the backend in `morphir.toml`. The table `[backends.elm]` holds the options. All keys are optional.

```toml
[pipeline]
backend = "elm"

[backends.elm]
profile = "model"            # "model" (default) | "literal"
placeholders = "refuse"      # "refuse" (default) | "debug-todo"
width = 120
elm_package = "finos/morphir-elm 22.0.2"

[backends.elm.mapping]
"morphir/SDK:basics#add" = { operator = "+" }
"morphir/SDK:list#map" = { function = "List.map" }
"morphir/SDK:decimal#decimal" = { type = "Decimal.Decimal", import = "MyCo.Decimal as Decimal" }
"morphir/SDK:basics#max" = {}

[backends.elm.packages]
"acme/common" = { package = "acme/common 1.0.0" }
```

- `profile` selects the profile. See [Profiles](#profiles).
- `placeholders` tells the backend what to do with a value that has no body. `refuse` stops generation with
  `elm.placeholder`. `debug-todo` writes `Debug.todo "<reason>"`.
- `width` is the line width of the printer. It must be an integer from 1 to 1000.
- `elm_package` is the Elm package that supplies unmapped `Morphir.SDK` modules. The value is
  `"author/name major.minor.patch"`. The default is `finos/morphir-elm 22.0.2`.
- `mapping` adds, replaces or removes mapping entries. See [Mapping](#mapping).
- `packages` maps a Morphir dependency package to an Elm package. An entry has only the form
  `{ package = "author/name 1.2.3" }`.

The engine checks the table before it runs the backend. An unknown key or a bad value gives `elm.invalid_option`.
A bad mapping entry gives `elm.invalid_mapping`.

The `elm` backend declares no build targets. The engine uses `pipeline.validation = "source-only"` for it, and it
refuses `"required"` with `build.unsupported_target`.

## Profiles

There are two profiles.

The `model` profile (the default) writes idiomatic Elm. A reference that has a mapping entry uses that entry. The
IR for `a + b` becomes:

```elm
add : Int -> Int -> Int
add a b =
    a + b
```

The `literal` profile ignores the mapping. Every reference stays qualified. Use it as a debug view of the IR. The
same IR becomes:

```elm
add : Morphir.SDK.Basics.Int -> Morphir.SDK.Basics.Int -> Morphir.SDK.Basics.Int
add a b =
    Morphir.SDK.Basics.add a b
```

If you set `mapping` with the `literal` profile, the backend gives a warning and ignores the entries.

## Mapping

A mapping entry tells the `model` profile how to write a Morphir reference in Elm. An entry is one of these:

- `{ operator = "+" }`: an Elm operator. With two arguments it becomes `a + b`. With fewer arguments it becomes a
  prefix operator, for example `(+) a`. An operator entry takes no `import`.
- `{ function = "List.map" }`: an Elm value or constructor, qualified or not.
- `{ type = "Dict.Dict" }`: an Elm type, qualified or not.
- `{}`: removes the entry. The reference falls back to the qualified form.

A `function` or `type` entry can have an `import`, for example `import = "MyCo.Decimal as Decimal"`. The backend
adds that line to the imports of the module. With no `import`, the backend imports the qualifier of the name, unless
Elm imports that module by default.

### The built-in table

`scripts/generate-builtin-mapping.py` writes `backend/mapping_builtin.mbt` from
`pkgs/morphir-sdk/conformance/bindings.json`. The script maps every binding whose `semanticSource` is
`elm/core 1.0.5` to the elm/core function of the same name. It adds a hand-written list of types, constructors and
operators. The table has elm/core semantics only. Other SDK references stay qualified, for example
`Morphir.SDK.LocalDate.addDays`. Do not edit `mapping_builtin.mbt` by hand. Run the script again.

Every built-in entry is fully qualified, for example `Basics.max`, `Maybe.Just` or `Basics.Int`. The backend writes
the name bare (`max`, `Just`, `Int`) only when a default import exposes it and nothing can capture it. A lower-case
name must not be a top-level value of the module or a binder in the declaration. An upper-case name must not be a type
or constructor of the module. In Elm, a module's own names win over a default import. A user entry keeps its text as
written, so a bare entry such as `{ function = "max" }` always prints bare.

The script writes each key in the canonical form that migration gives for legacy IR. It splits the Elm name at
camelCase boundaries and digit runs, and joins a run of single letters into one initialism. For example, `map2` has the
key `morphir/SDK:list#map-2` and `LT` has the key `morphir/SDK:basics#LT`.

### Namespaces

Types and values have separate namespaces in the mapping. One FQName can be a type and a function, for example
`morphir/SDK:basics#never`. A type reference looks only at type entries. A value or constructor reference looks only
at value entries.

An override goes to the namespace of its kind. A `type` entry replaces the type entry for its key. An `operator` or
`function` entry replaces the value entry for its key. An empty entry `{}` removes the key from both namespaces.

### Keys

A key is any IR FQName in canonical text form, for example `morphir/SDK:basics#add`. The key does not have to be an
SDK reference. You can map references in your own packages to existing Elm code. A key that is not a canonical FQName gives
`elm.invalid_mapping`. If the key parses but has a different spelling, the detail gives the canonical spelling.

## Output

The backend writes one Elm package project:

```
elm.json
morphir.json
src/<Package>/<Module>.elm
```

- Each IR module becomes one file in `src/`. The Elm module name is the package path followed by the module path,
  for example `Acme.Shapes.Geometry` for package `acme/shapes` and module `geometry`.
- `elm.json` has `"type": "package"`. Its name is the first part of the Morphir package path, `/`, and the other
  parts joined with `-`, for example `acme/shapes`. It exposes the public modules. If no module is public, it exposes
  all modules.
- `morphir.json` has the Morphir package name, `"sourceDirectory": "src"` and the exposed modules.

The `elm.json` is a package, not an application. An application `elm.json` must list every indirect dependency with
an exact version, and that needs a dependency solver. A package `elm.json` takes version ranges. The dependencies
are:

- `elm/core` `1.0.5 <= v < 2.0.0`, always.
- The `elm_package`, only when the code uses an unmapped `Morphir.SDK` reference.
- One entry for each dependency package that has an entry in `packages`. A dependency package with no entry gives a
  warning, not an error. `elm make` then reports the missing modules.

### Declarations

- Declarations keep the IR order. Imports are sorted.
- Public types and values are exposed. Private ones are not. A custom type with public constructors is exposed as
  `T(..)`. A custom type with private constructors is exposed as `T`.
- An opaque type specification becomes a custom type with one hidden constructor, `<Type>Opaque`.
- Module documentation becomes the module doc comment. Member documentation becomes the doc comment of the
  declaration.
- An Elm reserved word as a name gets the suffix `_`, for example `type_`.
- A type variable with a `typeclass` constraint gets the Elm prefix of that class: `number`, `comparable`,
  `appendable` or `compappend`. An unconstrained variable whose name starts with one of these prefixes gets the
  prefix `t`, so Elm does not read it as constrained.

### Attributes

Elm has no place for some IR data. The backend writes that data as attributes in an `attributes` code block in the
doc comment. The attribute value is Elm data, so krueger can read it back.

```attributes
@morphir.entry { kind = "main", name = "run" }
@morphir.annotation { fqname = "acme/api:tags#stable" }
@morphir.external { platform = "js", name = "Math.max" }
```

- `@morphir.entry` marks the target value of an entry point in an `Application`.
- `@morphir.annotation` holds an annotation of a value specification. A compact annotation has `fqname` and an
  optional `text`. A structured annotation has `fqname` and `arguments`.
- `@morphir.external` holds one binding of an `ExternalBody`.

The arguments of a structured annotation must be data: literals, unit, lists, tuples, records, constructors and
constructor applications of data. Any other value, for example a function application or a variable, gives
`elm.annotation_argument`.

### Local names

Elm rejects a local name that shadows another name in scope. The backend renames such a name with a numeric suffix,
for example `x` becomes `x_1`.

Before each top-level value, the backend resets the set of used local names to the top-level value names of the
module. Locals in different top-level values do not affect each other. Inside one top-level value, a name that two
branches or two lambdas both use gets a suffix in the second one. This output is valid Elm, but it can be less easy
to read. The suffix counter does not reset, so the numbers increase through the module.

`let` functions have no type signature. Elm reads type variables in a `let` signature as new rigid variables, so a
signature could make valid code fail.

## Refusals

The backend raises `ElmGenerationError`. `Refused` holds one `Problem`. `Failed` holds the problems of all failing
modules. A `Problem` has a `code`, a `node_path` and a `detail`. The `node_path` is the canonical FQName of the IR
node, or the option key.

Generation of a module stops at its first problem. The backend tries all modules, so one run reports every failing
module.

| Code | Cause |
| --- | --- |
| `elm.tuple_arity` | A tuple with fewer than two or more than three elements. Elm tuples have two or three. |
| `elm.derived_type` | A derived type. |
| `elm.decimal_literal` | A decimal literal. There is no decimal construction mapping yet. |
| `elm.placeholder` | A construct with no body while `placeholders = "refuse"`, a custom type with no constructors, or an incomplete type definition. |
| `elm.invalid_mapping` | A mapping entry that is not valid, for example a bad key or a constructor that maps to an operator. |
| `elm.print` | krueger could not print the AST. The path names the IR declaration. This is a backend defect. |
| `elm.int_literal` | An integer lexeme outside the Int64 range. |
| `elm.document_literal` | A document literal. Elm has no document literal. |
| `elm.literal_pattern` | A float or decimal pattern. Elm rejects these patterns. |
| `elm.unsupported_constraint` | A `typeclass` constraint that has no Elm class, or that is not text or a list of text. |
| `elm.name_collision` | Two IR names in one module give the same Elm name. |
| `elm.annotation_argument` | A structured annotation argument that is not data. |
| `elm.invalid_option` | An unknown option key or a bad option value. |
| `elm.cancelled` | The caller cancelled the generation. |

## Limits

- The backend does not write regular comments. krueger prints doc comments only.
- Derived types and decimal literals are refused (`elm.derived_type` and `elm.decimal_literal`).
- `elm make --optimize` rejects `Debug.todo`. Code generated with `placeholders = "debug-todo"` compiles only
  without `--optimize`.
- The `finos/morphir-elm` Elm package has no `Morphir.SDK.Maybe` module. An unmapped `morphir/SDK:maybe` reference,
  for example `morphir/SDK:maybe#has-value`, gives code that `elm make` rejects. Add a mapping entry for it.
- `packages` takes only Elm packages. Dependency source directories are not supported.

## Tests

```shell
moon test pkgs/morphir-elm/backend    # unit and generation tests
mise run test:elm                     # elm make on the generated fixture projects
```

`mise run test:elm` installs the pinned npm `elm` 0.19.1 package in `scripts/` and runs
`scripts/test-elm-make.mjs`. The script runs `pkgs/morphir-elm/acceptance`, which prints the generated projects for
the fixtures `rentals`, `shapes` and `specs` as JSON. It writes each project to a temporary directory and runs
`elm make` on its modules. The `specs` project uses `placeholders = "debug-todo"`. The first run needs network access,
because `elm make` downloads its packages. CI runs this task in the native build job.
