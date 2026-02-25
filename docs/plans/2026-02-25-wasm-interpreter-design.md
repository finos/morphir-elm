# Morphir Interpreter as WebAssembly Component Model Component

**Date**: 2026-02-25
**Status**: Approved
**Package**: `@morphir/interpreter-wasm` (`packages/morphir-interpreter-wasm/`)

## Problem

The Morphir interpreter is written in Elm and compiled to JavaScript. It can only be consumed from Node.js or browser JS environments. Exposing it as a WebAssembly Component Model component enables embedding in any runtime that supports the standard — Rust, Go, Python, .NET, and browsers — without rewriting the interpreter.

## Approach

Use ComponentizeJS (`jco componentize`) from the Bytecode Alliance to wrap the existing Elm-compiled JavaScript interpreter in a WASM component. This reuses 100% of existing interpreter code. The SpiderMonkey JS engine is bundled inside the component (~5-10MB binary).

Two build outputs:
- **Wasmtime target**: `.wasm` component for standalone runtimes
- **Browser target**: `jco transpile` ESM output for browsers

## WIT Interface

```wit
package morphir:interpreter;

interface types {
    record fq-name {
        package-path: string,
        module-path: string,
        local-name: string,
    }

    record morphir-value {
        root: u32,
        nodes: list<morphir-node>,
    }

    variant morphir-node {
        bool-val(bool),
        int-val(s64),
        float-val(f64),
        string-val(string),
        decimal-val(string),
        char-val(char),
        list-val(list<u32>),
        tuple-val(list<u32>),
        record-val(list<field-ref>),
        constructor-val(constructor-ref),
        unit-val,
    }

    record field-ref {
        name: string,
        value: u32,
    }

    record constructor-ref {
        fqn: fq-name,
        args: list<u32>,
    }

    variant eval-error {
        invalid-ir(string),
        reference-not-found(fq-name),
        argument-error(string),
        pattern-mismatch(string),
        type-error(string),
        variable-not-found(string),
        other(string),
    }

    resource ir-store {
        constructor(ir-json: string, uri: option<string>);
        uri: func() -> string;
        evaluate: func(fqn: fq-name, args: list<morphir-value>) -> result<morphir-value, eval-error>;
        reload: func(ir-json: string) -> result<_, eval-error>;
    }
}

interface eval {
    use types.{fq-name, morphir-value, eval-error};
    evaluate: func(ir-json: string, fqn: fq-name, args: list<morphir-value>) -> result<morphir-value, eval-error>;
}

world interpreter {
    export types;
    export eval;
}
```

### Interface semantics

- **`eval.evaluate`**: Stateless one-shot. Parses IR, evaluates function, returns result. Simple but re-parses IR every call.
- **`types.ir-store`**: Stateful resource. Load IR once (with optional URI identifier), evaluate many times. `reload` replaces the IR without creating a new handle. Dropping the handle triggers Component Model destructor for cleanup.
- **`uri`**: Optional identifier for the IR. If omitted, the component assigns a default. Useful when hosts manage multiple IRs.

### Data types

- **`fq-name`**: Fully qualified name with dot-separated paths (e.g., `{ package-path: "Morphir.SDK", module-path: "Basics", local-name: "add" }`).
- **`morphir-value`**: Index-based flat tree representation. WIT doesn't support recursive types, so the tree is flattened: `root` is the index of the top-level node, `nodes` is a flat list where children reference other nodes by index. This avoids JSON serialization entirely — hosts get native typed values.
- **`morphir-node`**: Covers all Morphir value types — primitives (bool, int, float, string, decimal, char), collections (list, tuple, record), algebraic types (constructor), and unit. Constructors handle Maybe, Result, and all custom types uniformly via `constructor-ref`.
- **`eval-error`**: Structured error variants matching the Elm interpreter's error model. Hosts can pattern-match on error type without parsing strings.
- **IR input**: Stays as JSON string since it's the existing serialization format and is only parsed once per load.

## Package Structure

```
packages/morphir-interpreter-wasm/
├── package.json
├── elm.json                    # sources: ["../../src", "src"]
├── wit/
│   └── interpreter.wit
├── src/
│   └── interpreter.js          # JS glue: WIT exports → Elm ports
├── build/                      # gitignored
│   ├── Morphir.Interpreter.js  # Compiled Elm
│   ├── interpreter.wasm        # WASM component
│   └── browser/                # jco transpile output
└── test/
    ├── fixtures/               # Small morphir-ir.json for testing
    └── interpreter.test.js     # Integration tests
```

## Elm Entry Point

New module at `src/Morphir/Interpreter/Worker.elm`:
- `Platform.worker` with ports (no subscriptions/commands needed for business logic)
- Wraps `Distribution.Codec.decodeVersionedDistribution` for IR loading
- Wraps `Interpreter.evaluate` with `Native.nativeFunctions`
- Converts between Elm `RawValue` and the flat indexed `morphir-value` representation
- Converts between Elm `Error` and structured `eval-error` variants
- References shared source at `../../src` via `elm.json`

## JS Glue (`src/interpreter.js`)

Bridges WIT-exported functions to the compiled Elm module:
- Initializes Elm app instances (one per `ir-store` resource)
- Translates WIT function calls to Elm port sends/receives
- Converts between WIT `morphir-value` (indexed flat tree) and JSON for Elm port communication
- Converts between WIT `fq-name` record and colon-separated string for Elm
- Maps WIT `eval-error` variants to/from Elm error JSON
- ComponentizeJS's SpiderMonkey engine handles the synchronous/async bridge

## Build Pipeline

Three mise tasks with dependencies:

1. **`build:interpreter-elm`** — `elm make src/Morphir/Interpreter/Worker.elm --optimize --output build/Morphir.Interpreter.js`
2. **`build:interpreter-wasm`** (depends on 1) — `jco componentize src/interpreter.js --wit wit/ --world-name interpreter --output build/interpreter.wasm`
3. **`build:interpreter-browser`** (depends on 2) — `jco transpile build/interpreter.wasm --out-dir build/browser`

Dev dependencies: `@bytecodealliance/jco`, `@bytecodealliance/componentize-js`

## Testing

Integration tests verify the full pipeline:
- One-shot `eval.evaluate` with known function + typed args
- Stateful `ir-store`: create, evaluate multiple times, verify results
- `reload` replaces IR correctly
- `uri` accessor returns assigned or default URI
- Error cases: bad JSON, unknown FQN, wrong argument count — verify correct `eval-error` variant
- Verify `morphir-value` round-trip: primitives, lists, records, constructors
- Run against both Wasmtime and browser outputs

Test fixture: minimal Morphir project with simple functions (add, identity, pattern match) compiled to `morphir-ir.json`.

## Trade-offs

- **Binary size**: ~5-10MB due to bundled SpiderMonkey. Acceptable for both targets.
- **Performance**: JS-in-WASM adds overhead vs native WASM. Acceptable for an evaluation engine that isn't in a hot loop.
- **Maintenance**: Zero interpreter code duplication. Changes to the Elm interpreter automatically flow through.
- **Value representation**: Index-based flat tree adds conversion overhead but gives hosts fully typed values with no JSON parsing. The conversion happens once at the boundary.
- **Future**: WIT interface is stable. Could later add a Rust-native implementation behind the same WIT for better performance without changing consumers.
