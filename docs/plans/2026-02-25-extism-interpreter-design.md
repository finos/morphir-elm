# Morphir Interpreter as Extism Plugin — Design

**Goal:** Replace the WebAssembly Component Model (jco/componentize-js, WIT) with an Extism plugin that exposes a single JSON-in / JSON-out evaluation function.

## Architecture

- **Plugin entry:** One exported function `evaluate` (reserved name `eval` avoided). Host passes a single JSON string; plugin returns a single JSON string.
- **Input JSON:** `{ "ir": <morphir-ir-json>, "fqn": "Package:Module:localName", "args": [ <ValueCodec-json>, ... ] }`
- **Output JSON:** Same as current Elm Worker: `{ "ok": true, "value": <ValueCodec-json> }` or `{ "ok": false, "error": { "variant": "...", "message": "..." } }`
- **Build:** Elm → JS (unchanged). Bundle Elm + new JS glue (no WIT, no flat morphir-value) into one CommonJS file. Compile with `extism-js` to produce `plugin.wasm`. No jco, no wit/, no browser transpile.
- **Testing:** Use Extism Node SDK to load `plugin.wasm` and call `eval` with JSON input; assert JSON output. Optionally keep a Node-testable bundle that exports the same JSON-in/out function for fast unit tests without loading WASM.

## Removed

- `@bytecodealliance/jco`, `@bytecodealliance/componentize-js`
- `wit/` directory (WIT interface)
- `build/browser/` (jco transpile output)
- Build task `build:interpreter-browser`
- All WIT-shaped types in JS (flat morphir-value, fq-name as WIT types); Python WIT helpers
- IrStore resource (stateful store); only stateless one-shot eval in the plugin

## Kept / Reused

- Elm Worker (loadIR, evaluateFunction ports); unchanged.
- ValueCodec JSON format for arguments and results.
- FQName as string `"Package:Module:name"` in the JSON payload (no change for callers who already use that format).
- Build steps: Elm → JS, bundle Elm + glue, then compile to WASM (tool changes from jco to extism-js).
- Post-processing: Elm IIFE scope fix, deep-&& break-up, _Process_sleep(0) patch (Extism uses QuickJS; keep until verified unnecessary).

## Host Usage

- **Node:** `@extism/extism` (or similar); load `plugin.wasm`, call `eval` with input JSON string, read output JSON string.
- **Python:** `extism`; same pattern.
- **CLI:** `extism run plugin.wasm eval --input '{"ir":...,"fqn":"P:M:f","args":[]}'` (or equivalent).

## Dependencies

- **Build:** `extism-js` (via mise `github:extism/js-pdk`), Binaryen (`wasm-merge`, `wasm-opt`) on PATH (e.g. `brew install binaryen`).
- **Runtime:** Extism host SDK per language; plugin runs with `--wasi`. No Component Model runtime.

