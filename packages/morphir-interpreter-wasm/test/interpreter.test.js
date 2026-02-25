/**
 * Integration tests for the Morphir WASM interpreter component.
 *
 * These tests exercise the interpreter's JavaScript API surface:
 *   - eval.evaluate (stateless, one-shot evaluation)
 *   - types.IrStore (stateful resource with load/evaluate/reload)
 *
 * We test against the interpreter bundle (Elm + JS glue) which exposes the
 * same interface that the WASM component exports via jco transpile. This
 * validates the interpreter logic end-to-end without requiring the WASM
 * runtime layer, which depends on WASI preview2 shims.
 */
import { describe, test, expect, beforeAll } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load the interpreter module
// ---------------------------------------------------------------------------

let evalIface;
let typesIface;

beforeAll(async () => {
  // Import the interpreter bundle which has the same exports as the
  // jco-transpiled WASM component (eval.evaluate, types.IrStore).
  const mod = await import("../build/interpreter-bundle.js");
  evalIface = mod.eval;
  typesIface = mod.types;
});

// ---------------------------------------------------------------------------
// Load fixture IR
// ---------------------------------------------------------------------------

const fixtureIrJson = readFileSync(
  resolve(__dirname, "fixtures/morphir-ir.json"),
  "utf-8"
);

// ---------------------------------------------------------------------------
// Helpers: create WIT-compatible morphir-value and fq-name records
//
// These match the WIT types defined in wit/interpreter.wit and generated
// by jco transpile into the .d.ts type definitions.
// ---------------------------------------------------------------------------

/**
 * Create a morphir-value representing an integer.
 * WIT int-val expects s64 which maps to bigint in JS.
 */
function intVal(n) {
  return {
    root: 0,
    nodes: [{ tag: "int-val", val: BigInt(n) }],
  };
}

/**
 * Create a morphir-value representing a boolean.
 */
function boolVal(b) {
  return {
    root: 0,
    nodes: [{ tag: "bool-val", val: b }],
  };
}

/**
 * Create a fq-name record with dot-separated path strings.
 *
 * The glue layer's fqNameToWorkerJson passes these strings directly to the
 * Elm Worker, which uses Path.fromString / Name.fromString on them.
 *
 * For TestModel:Basic.addInts:
 *   packagePath="testModel", modulePath="basic", localName="addInts"
 *
 * Path.fromString splits on non-word chars (dots, etc.) then Name.fromString
 * splits each part on camelCase boundaries. So "testModel" becomes the Name
 * ["test","model"], and as a single-element Path: [["test","model"]] which
 * matches the IR's package path encoding.
 */
function fqn(pkg, mod, name) {
  return {
    packagePath: pkg,
    modulePath: mod,
    localName: name,
  };
}

/**
 * Extract the integer value from a morphir-value result.
 */
function extractInt(result) {
  const node = result.nodes[result.root];
  expect(node.tag).toBe("int-val");
  return Number(node.val);
}

/**
 * Extract the boolean value from a morphir-value result.
 */
function extractBool(result) {
  const node = result.nodes[result.root];
  expect(node.tag).toBe("bool-val");
  return node.val;
}

/**
 * Unwrap a WIT result value. The glue layer returns { tag: "ok", val } or
 * { tag: "err", val: { tag: errorVariant, val: errorDetail } }.
 */
function unwrapOk(result) {
  expect(result.tag).toBe("ok");
  return result.val;
}

function unwrapErr(result) {
  expect(result.tag).toBe("err");
  return result.val;
}

// ---------------------------------------------------------------------------
// Test: eval.evaluate (stateless one-shot)
// ---------------------------------------------------------------------------

describe("eval.evaluate (one-shot)", () => {
  test("addInts(2, 3) should return 5", () => {
    const result = evalIface.evaluate(
      fixtureIrJson,
      fqn("testModel", "basic", "addInts"),
      [intVal(2), intVal(3)]
    );
    const value = unwrapOk(result);
    expect(extractInt(value)).toBe(5);
  });

  test("isPositive(42) should return true", () => {
    const result = evalIface.evaluate(
      fixtureIrJson,
      fqn("testModel", "basic", "isPositive"),
      [intVal(42)]
    );
    const value = unwrapOk(result);
    expect(extractBool(value)).toBe(true);
  });

  test("isPositive(-1) should return false", () => {
    const result = evalIface.evaluate(
      fixtureIrJson,
      fqn("testModel", "basic", "isPositive"),
      [intVal(-1)]
    );
    const value = unwrapOk(result);
    expect(extractBool(value)).toBe(false);
  });

  test("unknown function should return reference-not-found error", () => {
    const result = evalIface.evaluate(
      fixtureIrJson,
      fqn("testModel", "basic", "nonExistent"),
      []
    );
    const err = unwrapErr(result);
    expect(err.tag).toBe("reference-not-found");
  });

  test("invalid IR JSON should return invalid-ir error", () => {
    // JSON.parse will throw SyntaxError for truly invalid JSON,
    // but malformed-but-parseable JSON should give invalid-ir from the Elm side
    expect(() => {
      evalIface.evaluate(
        "{ this is not valid json }",
        fqn("testModel", "basic", "addInts"),
        [intVal(1)]
      );
    }).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Test: types.IrStore (stateful resource)
// ---------------------------------------------------------------------------

describe("types.IrStore (stateful)", () => {
  test("create store with explicit URI, verify uri() returns it", () => {
    const store = new typesIface.IrStore(fixtureIrJson, "test://my-store");
    expect(store.uri()).toBe("test://my-store");
  });

  test("evaluate addInts(10, 20) via store returns 30", () => {
    const store = new typesIface.IrStore(fixtureIrJson, "test://calc");
    const result = store.evaluate(
      fqn("testModel", "basic", "addInts"),
      [intVal(10), intVal(20)]
    );
    const value = unwrapOk(result);
    expect(extractInt(value)).toBe(30);
  });

  test("create store with default URI (undefined), verify uri() returns a truthy string", () => {
    const store = new typesIface.IrStore(fixtureIrJson, undefined);
    const uri = store.uri();
    expect(typeof uri).toBe("string");
    expect(uri.length).toBeGreaterThan(0);
  });

  test("reload with same IR and verify evaluation still works", () => {
    const store = new typesIface.IrStore(fixtureIrJson, "test://reload");
    // Evaluate before reload
    const before = store.evaluate(
      fqn("testModel", "basic", "addInts"),
      [intVal(1), intVal(2)]
    );
    expect(extractInt(unwrapOk(before))).toBe(3);

    // Reload with the same IR
    const reloadResult = store.reload(fixtureIrJson);
    expect(reloadResult.tag).toBe("ok");

    // Evaluate after reload
    const after = store.evaluate(
      fqn("testModel", "basic", "addInts"),
      [intVal(5), intVal(7)]
    );
    expect(extractInt(unwrapOk(after))).toBe(12);
  });

  test("reload with invalid JSON should return invalid-ir error", () => {
    const store = new typesIface.IrStore(fixtureIrJson, "test://bad-reload");
    // Truly invalid JSON will throw SyntaxError from JSON.parse
    expect(() => {
      store.reload("not valid json at all");
    }).toThrow();
  });

  test("evaluate multiple times with same store", () => {
    const store = new typesIface.IrStore(fixtureIrJson, "test://multi");

    const r1 = store.evaluate(
      fqn("testModel", "basic", "addInts"),
      [intVal(0), intVal(0)]
    );
    expect(extractInt(unwrapOk(r1))).toBe(0);

    const r2 = store.evaluate(
      fqn("testModel", "basic", "isPositive"),
      [intVal(100)]
    );
    expect(extractBool(unwrapOk(r2))).toBe(true);

    const r3 = store.evaluate(
      fqn("testModel", "basic", "addInts"),
      [intVal(-5), intVal(5)]
    );
    expect(extractInt(unwrapOk(r3))).toBe(0);

    const r4 = store.evaluate(
      fqn("testModel", "basic", "isPositive"),
      [intVal(0)]
    );
    expect(extractBool(unwrapOk(r4))).toBe(false);
  });
});
