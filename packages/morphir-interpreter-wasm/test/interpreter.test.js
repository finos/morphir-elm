/**
 * Integration tests for the Morphir Extism interpreter plugin.
 *
 * Runs the plugin via the Extism CLI (extism call) so we avoid SDK/runtime
 * ABI mismatches with js-pdk-built plugins. Calls evaluate with JSON input,
 * parses JSON output and asserts: { ok, value } or { ok: false, error }.
 */
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const wasmPath = resolve(__dirname, "../build/plugin.wasm");
const extismCmd = process.env.EXTISM_CLI ?? "extism";

function runEvaluate(input) {
  const inputJson = JSON.stringify(input);
  const out = execFileSync(extismCmd, [
    "call",
    wasmPath,
    "evaluate",
    "--input",
    inputJson,
    "--wasi",
  ], { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(out.trim());
}

const fixtureIrJson = readFileSync(
  resolve(__dirname, "fixtures/morphir-ir.json"),
  "utf-8"
);

function fqn(pkg, mod, name) {
  return `${pkg}:${mod}:${name}`;
}

before(() => {
  try {
    execFileSync(extismCmd, ["--version"], { encoding: "utf-8" });
  } catch (e) {
    throw new Error(
      `Extism CLI not found (set EXTISM_CLI or add github:extism/cli to mise). ${e.message}`
    );
  }
});

describe("evaluate (JSON in / JSON out)", () => {
  it("addInts(2, 3) returns 5", () => {
    const result = runEvaluate({
      ir: JSON.parse(fixtureIrJson),
      fqn: fqn("testModel", "basic", "addInts"),
      args: [
        ["Literal", [], ["WholeNumberLiteral", 2]],
        ["Literal", [], ["WholeNumberLiteral", 3]],
      ],
    });
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.value, [
      "Literal",
      [],
      ["WholeNumberLiteral", 5],
    ]);
  });

  it("isPositive(42) returns true", () => {
    const result = runEvaluate({
      ir: JSON.parse(fixtureIrJson),
      fqn: fqn("testModel", "basic", "isPositive"),
      args: [["Literal", [], ["WholeNumberLiteral", 42]]],
    });
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.value, ["Literal", [], ["BoolLiteral", true]]);
  });

  it("isPositive(-1) returns false", () => {
    const result = runEvaluate({
      ir: JSON.parse(fixtureIrJson),
      fqn: fqn("testModel", "basic", "isPositive"),
      args: [["Literal", [], ["WholeNumberLiteral", -1]]],
    });
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.value, ["Literal", [], ["BoolLiteral", false]]);
  });

  it("unknown function returns reference-not-found error", () => {
    const result = runEvaluate({
      ir: JSON.parse(fixtureIrJson),
      fqn: fqn("testModel", "basic", "nonExistent"),
      args: [],
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.error.variant, "reference-not-found");
  });

  it("invalid IR returns invalid-ir error", () => {
    const result = runEvaluate({
      ir: { not: "valid morphir ir" },
      fqn: fqn("testModel", "basic", "addInts"),
      args: [],
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.error.variant, "invalid-ir");
  });

  it("missing input fields returns argument-error", () => {
    const result = runEvaluate({ ir: fixtureIrJson });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.error.variant, "argument-error");
  });
});
