# @morphir/interpreter-wasm

Morphir interpreter as an **Extism plugin**: JSON in, JSON out.

## Build

**Requirements:** In this repo, [mise](https://mise.jdx.dev) provides both [extism-js](https://github.com/extism/js-pdk) and [Binaryen](https://github.com/WebAssembly/binaryen) (`wasm-merge`, `wasm-opt`). Ensure you have run `mise install` or `mise use` so the tools are active.

From the repo root:

```bash
mise run build:interpreter-wasm
```

Produces `packages/morphir-interpreter-wasm/build/plugin.wasm` and `build/interpreter-bundle.cjs`.

## Run (CLI)

Using the [Extism CLI](https://extism.org/docs/install):

```bash
extism run build/plugin.wasm evaluate --input '{"ir":<morphir-ir>,"fqn":"Package:Module:name","args":[]}' --wasi
```

## Input / output

- **Input (JSON):** `{ "ir": <morphir-ir>, "fqn": "Package:Module:localName", "args": [ <ValueCodec-json>, ... ] }`
- **Output (JSON):** `{ "ok": true, "value": <ValueCodec-json> }` or `{ "ok": false, "error": { "variant": "...", "message": "..." } }`

FQName format: `package-path:module-path:local-name` (PascalCase segments with `.`, camelCase local name). ValueCodec is the nested JSON shape used by the Elm IR (e.g. `["Literal", [], ["WholeNumberLiteral", 42]]`).

See [python/README.md](python/README.md) for Python host usage and value helpers.
