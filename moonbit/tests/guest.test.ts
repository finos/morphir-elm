// Tests the packaged Elm extension module (moonbit:package) through the morphir-bytes-v1 ABI.
// ELM_EXTENSION_WASM names another module, for example a release artifact.
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { BytesSession, moduleImports, wasmGuest } from "../tooling/bytes-host";
import { moduleVersion, wasmArtifactName } from "../tooling/module";
import { COMPILE, compile, generate, MOONBIT, openSession, PROJECTS, readProject, rpc } from "./guest-harness";

const version = moduleVersion(readFileSync(join(MOONBIT, "moon.mod"), "utf8"));
const wasmPath =
  process.env.ELM_EXTENSION_WASM ??
  join(MOONBIT, "..", "dist", "elm-extension", "artifacts", wasmArtifactName(version));
if (!existsSync(wasmPath)) {
  throw new Error(`${wasmPath} does not exist; run MISE_ENV=moonbit mise run moonbit:package first`);
}
const bytes = readFileSync(wasmPath);
const guest = wasmGuest(bytes);

// The projects that need SDK modules the frontend does not have yet.
const NEED_SDK_MODULES = ["elm-json-schema", "elm-reference-model", "elm-spark", "elm-typespec", "examples-sample"];
const projects = readdirSync(PROJECTS).sort();
const clean = projects.filter((name) => !NEED_SDK_MODULES.includes(name));

describe("the module", () => {
  test("imports only the three morphir_bytes_v1 functions", () => {
    expect(moduleImports(bytes)).toEqual([
      "morphir_bytes_v1.input_byte",
      "morphir_bytes_v1.input_len",
      "morphir_bytes_v1.output_byte",
    ]);
  });

  test("exports handle and one memory of at most 4096 pages", () => {
    const exports = WebAssembly.Module.exports(new WebAssembly.Module(bytes));
    expect(exports.filter((e) => e.kind === "function").map((e) => e.name)).toContain("handle");
    const memories = exports.filter((e) => e.kind === "memory");
    expect(memories.length).toBe(1);
    const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {
      morphir_bytes_v1: { input_len: () => 0, input_byte: () => -1, output_byte: () => {} },
    });
    const memory = instance.exports.memory as WebAssembly.Memory;
    expect(() => memory.grow(4097 - memory.buffer.byteLength / 65536)).toThrow();
  });
});

describe("a session", () => {
  test("describe reports morphir-elm at the module version", () => {
    const session = new BytesSession(guest);
    const reply = rpc(session, 1, "morphir.extension.describe", { protocolVersions: ["0.2.0-draft.1", "0.1"] });
    expect(reply.result.extension.id).toBe("morphir-elm");
    expect(reply.result.extension.version).toBe(version);
    expect(reply.result.capabilities.frontend.multiDocument).toBe(true);
  });

  test("answers each request once, notifications with nothing, and ends at exit", () => {
    const session = new BytesSession(guest);
    expect(rpc(session, 1, "morphir.unknown", {}).error.code).toBe(-32014); // before initialize
    const ready = openSession(guest, COMPILE);
    expect(ready.call(JSON.stringify({ jsonrpc: "2.0", method: "morphir.initialized" }))).toEqual({
      kind: "notification",
    });
    expect(rpc(ready, 2, "morphir.unknown", {}).error.code).toBe(-32601);
    expect(rpc(ready, 3, "morphir.ping", {}).result).toEqual({});
    expect(ready.call(JSON.stringify({ jsonrpc: "2.0", method: "morphir.exit" }))).toEqual({ kind: "exit" });
  });
});

describe("compile", () => {
  test.each(clean)("%s compiles to a model", (name) => {
    const reply = compile(guest, readProject(name));
    expect(reply.result.success).toBe(true);
    expect(reply.result.model.payload.codec).toBe("morphir-json");
  });

  test.each(NEED_SDK_MODULES)("%s fails with diagnostics and no model", (name) => {
    const reply = compile(guest, readProject(name));
    expect(reply.result.success).toBe(false);
    expect(reply.result.model).toBeUndefined();
    expect(reply.result.diagnostics.length).toBeGreaterThan(0);
  });

  test("gives the same bytes twice", () => {
    const project = readProject("examples-tutorial");
    expect(JSON.stringify(compile(guest, project))).toBe(JSON.stringify(compile(guest, project)));
  });
});

describe("generate", () => {
  const elm = join(MOONBIT, "scripts", "node_modules", ".bin", process.platform === "win32" ? "elm.cmd" : "elm");

  test.each(clean)("the Elm generated from %s compiles with elm make", (name) => {
    const compiled = compile(guest, readProject(name));
    const reply = generate(guest, compiled.result.model);
    expect(reply.result.success).toBe(true);
    const dir = mkdtempSync(join(tmpdir(), "elm-extension-"));
    try {
      for (const artifact of reply.result.artifacts) {
        expect(artifact.binary).toBe(false);
        mkdirSync(dirname(join(dir, artifact.path)), { recursive: true });
        writeFileSync(join(dir, artifact.path), artifact.content);
      }
      const modules = reply.result.artifacts
        .map((a: { path: string }) => a.path)
        .filter((p: string) => p.startsWith("src/") && p.endsWith(".elm"));
      const made = spawnSync(elm, ["make", ...modules, `--output=${process.platform === "win32" ? "NUL" : "/dev/null"}`], {
        cwd: dir,
        encoding: "utf8",
      });
      expect(made.status, made.stdout + made.stderr).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
