import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checksumLine, moduleVersion, wasmArtifactName } from "./module";

test("moduleVersion reads moonbit/moon.mod", () => {
  const text = readFileSync(join(import.meta.dir, "..", "moon.mod"), "utf8");
  expect(moduleVersion(text)).toMatch(/^\d+\.\d+\.\d+/);
});

test("moduleVersion refuses a file without a version", () => {
  expect(() => moduleVersion('name = "finos/morphir-elm"\n')).toThrow(/no version/);
});

test("the guest's VERSION constant equals the module version", () => {
  const moonMod = readFileSync(join(import.meta.dir, "..", "moon.mod"), "utf8");
  const claims = readFileSync(join(import.meta.dir, "..", "mep", "claims.mbt"), "utf8");
  expect(claims).toContain(`pub const VERSION : String = "${moduleVersion(moonMod)}"`);
});

test("wasmArtifactName names the version", () => {
  expect(wasmArtifactName("0.5.0-preview.1")).toBe("morphir-elm-0.5.0-preview.1.wasm");
});

test("checksumLine is the sha256sum format", () => {
  expect(checksumLine("a".repeat(64), "x.wasm")).toBe(`${"a".repeat(64)}  x.wasm\n`);
  expect(() => checksumLine("A".repeat(64), "x.wasm")).toThrow(/SHA-256/);
});
