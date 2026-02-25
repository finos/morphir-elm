# Extism Interpreter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all WebAssembly Component Model artifacts and ship the Morphir interpreter as an Extism plugin with JSON in / JSON out.

**Architecture:** Single `eval` export; Host.inputString() → JSON parse → Elm loadIR + evaluateFunction → JSON stringify → Host.outputString(). Build: Elm → JS, bundle to CJS, compile with extism-js → plugin.wasm.

**Tech Stack:** Elm 0.19, Extism js-pdk (extism-js), Bun (tasks), @extism/extism (Node tests).

---

### Task 1: Remove Component Model dependencies and browser build

**Files:**
- Modify: `packages/morphir-interpreter-wasm/package.json`
- Delete: `.mise/tasks/build/interpreter-browser.ts`
- Modify: `mise.toml` (add extism if desired; optional)

**Steps:**
1. In `package.json` remove `@bytecodealliance/jco` and `@bytecodealliance/componentize-js`; add `@extism/extism` as devDependency for tests.
2. Delete `.mise/tasks/build/interpreter-browser.ts`.
3. Run `bun install` in repo root to update lockfile.

---

### Task 2: Remove WIT and browser build artifacts

**Files:**
- Delete: `packages/morphir-interpreter-wasm/wit/` (if present)
- Delete: `packages/morphir-interpreter-wasm/build/browser/` directory and contents
- Modify: `.gitignore` if it references browser or wit

**Steps:**
1. Remove `wit/` and `build/browser/` (if they exist).
2. Ensure `.gitignore` still ignores `build/` and does not require wit or browser paths.

---

### Task 3: Rewrite interpreter.js as Extism plugin (JSON in/out)

**Files:**
- Modify: `packages/morphir-interpreter-wasm/src/interpreter.js`

**Steps:**
1. Remove all WIT-specific code (flat morphir-value, IrStore, eval exports with WIT types).
2. Keep: FQName string parsing to Worker format (`packagePath`, `modulePath`, `localName`), createApp/sendAndReceive, Elm Worker ports.
3. Add: Single function that reads `Host.inputString()`, parses JSON `{ ir, fqn, args }`, loads IR, calls evaluateFunction with args (ValueCodec JSON), then `Host.outputString(JSON.stringify(result))`. Export as CommonJS: `module.exports = { eval: function eval() { ... } };`.
4. Use the same Elm result shape: `{ ok: true, value }` or `{ ok: false, error: { variant, message } }`. On throw, return `{ ok: false, error: { variant: "other", message: e.message } }`.
5. Do not use ESM `import` for Elm; the build will inline Elm above this glue (so `Elm` is in scope from the bundle).

---

### Task 4: Update build task for Extism

**Files:**
- Modify: `.mise/tasks/build/interpreter-wasm.ts`

**Steps:**
1. Keep: Read Elm output, read glue, Elm IIFE scope fix, breakUpDeepConditions, _Process_sleep patch.
2. Change: Output bundle as CommonJS: wrap in `(function() { ... })();` and `module.exports = { eval: ... };` or ensure glue already has `module.exports` and bundle produces one CJS file.
3. Replace jco componentize step with: `extism-js build/interpreter-bundle.cjs -o build/plugin.wasm` (or keep output as interpreter-bundle.js and have extism-js accept it if it supports ESM→CJS; extism-js expects CJS). So: write bundle as .cjs with module.exports.
4. Ensure the bundled glue uses `module.exports = { eval }` and that Elm is in scope (scope.Elm) in the same file.
5. Document requirement: `extism-js` and Binaryen on PATH (mise or install script).

---

### Task 5: Update tests for JSON-in/JSON-out

**Files:**
- Modify: `packages/morphir-interpreter-wasm/test/interpreter.test.js`

**Steps:**
1. Use Extism Node host: load `build/plugin.wasm`, call `eval` with input JSON string, parse output JSON.
2. Input shape: `{ ir: fixtureIrJson, fqn: "testModel:basic:addInts", args: [ ["Literal", [], ["WholeNumberLiteral", 2]], ... ] }`.
3. Assert output: `{ ok: true, value: ["Literal", [], ["WholeNumberLiteral", 5]] }` and error cases `{ ok: false, error: { variant, message } }`.
4. Remove tests that depend on IrStore (stateful store); keep one-shot eval tests. Optionally add a test that runs the bundle in Node (without WASM) if we export a runEval for testing.
5. If tests run against WASM only, ensure build:interpreter-wasm runs first and extism-js is available.

---

### Task 6: Simplify Python package for JSON API

**Files:**
- Modify: `packages/morphir-interpreter-wasm/python/README.md`
- Modify or simplify: `packages/morphir-interpreter-wasm/python/morphir_interpreter_types.py`

**Steps:**
1. Update README: explain that the plugin is Extism-based, JSON in / JSON out; document input/output JSON shape; remove WIT/to_wit_dict references.
2. Simplify Python types: keep helpers that build ValueCodec JSON and fqn string for convenience; remove WIT-specific encoders (to_wit_dict, flat morphir-value). Optionally keep MorphirValue as a dataclass that can serialize to ValueCodec JSON for args.

---

### Task 7: Update package.json description and README

**Files:**
- Modify: `packages/morphir-interpreter-wasm/package.json`
- Modify: `packages/morphir-interpreter-wasm/README.md` (if exists) or root README reference

**Steps:**
1. Set description to "Morphir interpreter as an Extism plugin (JSON in/out)".
2. Add short README or section: how to build (mise run build:interpreter-wasm), how to run (extism run plugin.wasm eval --input '...'), input/output JSON format.

---

### Task 8: Remove references to jco/browser in docs and workflows

**Files:**
- Grep: `jco`, `componentize`, `transpile`, `interpreter-browser`, `wit/`
- Modify: any docs or GitHub workflows that reference the old build or artifacts

**Steps:**
1. Update docs/plans that reference interpreter-browser or jco.
2. Update .github/workflows if they build or publish interpreter-browser or wit.
3. Ensure no broken links to wit/ or build/browser.
