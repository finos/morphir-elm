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
    resource ir-store {
        constructor(ir-json: string, uri: option<string>);
        uri: func() -> string;
        evaluate: func(fqn: string, args: list<string>) -> result<string, string>;
        reload: func(ir-json: string) -> result<_, string>;
    }
}

interface eval {
    evaluate: func(ir-json: string, fqn: string, args: list<string>) -> result<string, string>;
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
- **Data format**: All arguments and return values are JSON-encoded strings. FQN is colon-separated (e.g., `Morphir.SDK:Basics:add`).

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
- Wraps `Value.Codec` for decoding arguments and encoding results
- References shared source at `../../src` via `elm.json`

## JS Glue (`src/interpreter.js`)

Bridges WIT-exported functions to the compiled Elm module:
- Initializes Elm app instances (one per `ir-store` resource)
- Translates WIT function calls to Elm port sends/receives
- ComponentizeJS's SpiderMonkey engine handles the synchronous ↔ async bridge

## Build Pipeline

Three mise tasks with dependencies:

1. **`build:interpreter-elm`** — `elm make src/Morphir/Interpreter/Worker.elm --optimize --output build/Morphir.Interpreter.js`
2. **`build:interpreter-wasm`** (depends on 1) — `jco componentize src/interpreter.js --wit wit/ --world-name interpreter --output build/interpreter.wasm`
3. **`build:interpreter-browser`** (depends on 2) — `jco transpile build/interpreter.wasm --out-dir build/browser`

Dev dependencies: `@bytecodealliance/jco`, `@bytecodealliance/componentize-js`

## Testing

Integration tests verify the full pipeline:
- One-shot `eval.evaluate` with known function + args
- Stateful `ir-store`: create, evaluate multiple times, verify results
- `reload` replaces IR correctly
- `uri` accessor returns assigned or default URI
- Error cases: bad JSON, unknown FQN, wrong argument count
- Run against both Wasmtime and browser outputs

Test fixture: minimal Morphir project with simple functions (add, identity, pattern match) compiled to `morphir-ir.json`.

## Trade-offs

- **Binary size**: ~5-10MB due to bundled SpiderMonkey. Acceptable for both targets.
- **Performance**: JS-in-WASM adds overhead vs native WASM. Acceptable for an evaluation engine that isn't in a hot loop.
- **Maintenance**: Zero interpreter code duplication. Changes to the Elm interpreter automatically flow through.
- **Future**: WIT interface is stable. Could later add a Rust-native implementation behind the same WIT for better performance without changing consumers.
